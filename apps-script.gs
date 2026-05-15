/**
 * HANAN PORTFOLIO - Messages API
 * Google Apps Script backend for receiving and serving contact form messages
 *
 * Setup:
 * 1. This script is attached to your Google Sheet
 * 2. Deploy as Web App (Anyone access)
 * 3. Copy the Web App URL
 * 4. Use that URL in portfolio form + dashboard
 */

// ===== CONFIG =====
var SHEET_NAME = 'Sheet1'; // Default sheet name (change if renamed)
var SECRET_KEY = 'hanan_2026_secret'; // Simple security check

/**
 * Handle GET requests - Returns all messages (for dashboard)
 */
function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
                || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return jsonResponse({ ok: true, count: 0, messages: [] });
    }

    var range = sheet.getRange(2, 1, lastRow - 1, 8);
    var values = range.getValues();

    var messages = values.map(function (row, i) {
      return {
        id: row[7] || ('msg_' + (i + 1)),
        timestamp: row[0] ? new Date(row[0]).toISOString() : null,
        name: row[1] || '',
        email: row[2] || '',
        phone: row[3] || '',
        projectType: row[4] || '',
        message: row[5] || '',
        status: row[6] || 'unread'
      };
    }).reverse(); // Latest first

    return jsonResponse({
      ok: true,
      count: messages.length,
      messages: messages
    });

  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

/**
 * Handle POST requests - Save new message from portfolio form
 */
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
                || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Parse incoming data
    var data;
    if (e.postData && e.postData.type === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter || {};
    }

    // Handle status update (mark read/unread/delete)
    if (data.action === 'updateStatus') {
      return handleStatusUpdate(sheet, data);
    }

    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return jsonResponse({ ok: false, error: 'Name, email, and message are required.' });
    }

    // Generate unique ID
    var msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    var timestamp = new Date();

    // Append row
    sheet.appendRow([
      timestamp,
      data.name.toString().substring(0, 200),
      data.email.toString().substring(0, 200),
      data.phone || '',
      data.projectType || '',
      data.message.toString().substring(0, 5000),
      'unread',
      msgId
    ]);

    // Send email notification (optional)
    try {
      sendNotificationEmail(data, msgId);
    } catch (emailErr) {
      // Email failure shouldn't break form submission
      Logger.log('Email error: ' + emailErr.toString());
    }

    return jsonResponse({
      ok: true,
      id: msgId,
      message: 'Message received successfully!'
    });

  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

/**
 * Handle status updates (read/unread/delete)
 */
function handleStatusUpdate(sheet, data) {
  if (data.secret !== SECRET_KEY) {
    return jsonResponse({ ok: false, error: 'Unauthorized' });
  }

  if (!data.id) {
    return jsonResponse({ ok: false, error: 'Message ID required' });
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse({ ok: false, error: 'No messages found' });

  var idColumn = sheet.getRange(2, 8, lastRow - 1, 1).getValues();
  var rowIndex = -1;

  for (var i = 0; i < idColumn.length; i++) {
    if (idColumn[i][0] === data.id) {
      rowIndex = i + 2;
      break;
    }
  }

  if (rowIndex === -1) {
    return jsonResponse({ ok: false, error: 'Message not found' });
  }

  if (data.status === 'delete') {
    sheet.deleteRow(rowIndex);
    return jsonResponse({ ok: true, action: 'deleted' });
  } else {
    sheet.getRange(rowIndex, 7).setValue(data.status || 'read');
    return jsonResponse({ ok: true, action: 'updated', status: data.status });
  }
}

/**
 * Send email notification when new message arrives
 */
function sendNotificationEmail(data, msgId) {
  var recipient = Session.getActiveUser().getEmail();
  if (!recipient) return;

  var subject = '🔔 New Portfolio Message from ' + (data.name || 'Visitor');
  var body =
    'You have a new message from your portfolio!\n\n' +
    '═══════════════════════════════════════\n\n' +
    '👤 Name: ' + (data.name || 'N/A') + '\n' +
    '📧 Email: ' + (data.email || 'N/A') + '\n' +
    '📱 Phone: ' + (data.phone || 'N/A') + '\n' +
    '💼 Project Type: ' + (data.projectType || 'N/A') + '\n\n' +
    '📝 Message:\n' + (data.message || '') + '\n\n' +
    '═══════════════════════════════════════\n\n' +
    'ID: ' + msgId + '\n' +
    'Time: ' + new Date().toLocaleString() + '\n\n' +
    'View in Dashboard: https://hanan-develop.github.io/hanan-dashboard/messages.html\n';

  MailApp.sendEmail(recipient, subject, body);
}

/**
 * Helper: JSON response
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function - Run this manually to test
 */
function testInsert() {
  var testData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+92 300 0000000',
    projectType: 'WordPress Website',
    message: 'This is a test message from Apps Script.'
  };

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.appendRow([
    new Date(),
    testData.name,
    testData.email,
    testData.phone,
    testData.projectType,
    testData.message,
    'unread',
    'msg_test_' + Date.now()
  ]);

  Logger.log('Test row added successfully!');
}

/**
 * HANAN PORTFOLIO - Messages API v2
 * Now with credentials management
 *
 * SHEETS NEEDED:
 * 1. "Sheet1" or first sheet - Messages
 * 2. "Credentials" - Stores username/password
 * 3. "PasswordHistory" - Stores old passwords for audit
 *
 * If sheets don't exist, they will be auto-created
 */

// ===== CONFIG =====
var SHEET_MESSAGES = 'Sheet1';
var SHEET_CREDS = 'Credentials';
var SHEET_HISTORY = 'PasswordHistory';
var SECRET_KEY = 'hanan_2026_secret';

// Default credentials (used if Credentials sheet is empty)
var DEFAULT_USERNAME = 'hanan';
var DEFAULT_PASSWORD = 'hanan@2026';

/**
 * GET requests handler
 * - ?action=getMessages  → returns all messages
 * - ?action=getCreds&secret=XXX  → returns current credentials
 * - default → returns messages (backward compatible)
 */
function doGet(e) {
  try {
    var action = (e.parameter && e.parameter.action) || 'getMessages';

    if (action === 'getCreds') {
      return getCurrentCredentials(e.parameter.secret);
    }

    return getMessages();

  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

/**
 * POST requests handler
 * - action=updateStatus  → mark read/unread/delete message
 * - action=changeCreds   → update username/password
 * - default              → save new message (from contact form)
 */
function doPost(e) {
  try {
    var data;
    if (e.postData && e.postData.type === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter || {};
    }

    if (data.action === 'updateStatus') {
      return handleStatusUpdate(data);
    }

    if (data.action === 'changeCreds') {
      return changeCredentials(data);
    }

    if (data.action === 'verifyLogin') {
      return verifyLogin(data);
    }

    return saveMessage(data);

  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

// ===== MESSAGES =====

function getMessages() {
  var sheet = getSheet(SHEET_MESSAGES);
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
  }).reverse();

  return jsonResponse({ ok: true, count: messages.length, messages: messages });
}

function saveMessage(data) {
  if (!data.name || !data.email || !data.message) {
    return jsonResponse({ ok: false, error: 'Name, email, and message are required.' });
  }

  var sheet = getSheet(SHEET_MESSAGES);
  var msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  var timestamp = new Date();

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

  try {
    sendNotificationEmail(data, msgId);
  } catch (emailErr) {
    Logger.log('Email error: ' + emailErr.toString());
  }

  return jsonResponse({ ok: true, id: msgId, message: 'Message received successfully!' });
}

function handleStatusUpdate(data) {
  if (data.secret !== SECRET_KEY) {
    return jsonResponse({ ok: false, error: 'Unauthorized' });
  }

  if (!data.id) return jsonResponse({ ok: false, error: 'Message ID required' });

  var sheet = getSheet(SHEET_MESSAGES);
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

  if (rowIndex === -1) return jsonResponse({ ok: false, error: 'Message not found' });

  if (data.status === 'delete') {
    sheet.deleteRow(rowIndex);
    return jsonResponse({ ok: true, action: 'deleted' });
  } else {
    sheet.getRange(rowIndex, 7).setValue(data.status || 'read');
    return jsonResponse({ ok: true, action: 'updated', status: data.status });
  }
}

// ===== CREDENTIALS MANAGEMENT =====

/**
 * Verify login credentials
 */
function verifyLogin(data) {
  if (!data.username || !data.password) {
    return jsonResponse({ ok: false, error: 'Username and password required' });
  }

  var creds = getStoredCredentials();
  var inputUser = data.username.toString().trim().toLowerCase();
  var inputPass = data.password.toString();

  if (inputUser === creds.username.toLowerCase() && inputPass === creds.password) {
    return jsonResponse({
      ok: true,
      username: creds.username,
      message: 'Login successful'
    });
  }

  return jsonResponse({ ok: false, error: 'Invalid username or password' });
}

/**
 * Get current credentials (admin only — needs secret key)
 */
function getCurrentCredentials(secret) {
  if (secret !== SECRET_KEY) {
    return jsonResponse({ ok: false, error: 'Unauthorized' });
  }

  var creds = getStoredCredentials();
  return jsonResponse({
    ok: true,
    username: creds.username,
    password: creds.password
  });
}

/**
 * Change username/password
 */
function changeCredentials(data) {
  // Verify current password first
  if (!data.currentPassword) {
    return jsonResponse({ ok: false, error: 'Current password required' });
  }

  var creds = getStoredCredentials();
  if (data.currentPassword !== creds.password) {
    return jsonResponse({ ok: false, error: 'Current password is incorrect' });
  }

  // Validate new credentials
  var newUsername = (data.newUsername || creds.username).toString().trim();
  var newPassword = (data.newPassword || '').toString();

  if (!newPassword || newPassword.length < 6) {
    return jsonResponse({ ok: false, error: 'New password must be at least 6 characters' });
  }

  if (!newUsername || newUsername.length < 3) {
    return jsonResponse({ ok: false, error: 'Username must be at least 3 characters' });
  }

  // Save old credentials to history
  saveToHistory(creds.username, creds.password, newUsername);

  // Update credentials
  setCredentials(newUsername, newPassword);

  // Send email notification
  try {
    sendPasswordChangeEmail(newUsername);
  } catch (emailErr) {
    Logger.log('Email error: ' + emailErr.toString());
  }

  return jsonResponse({
    ok: true,
    username: newUsername,
    message: 'Credentials updated successfully'
  });
}

/**
 * Get stored credentials from Credentials sheet
 * Returns default if sheet is empty
 */
function getStoredCredentials() {
  var sheet = getSheet(SHEET_CREDS);

  // Ensure headers exist
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Username', 'Password', 'Last Updated']);
  }

  if (sheet.getLastRow() < 2) {
    // No credentials yet — use default and save
    setCredentials(DEFAULT_USERNAME, DEFAULT_PASSWORD);
    return { username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD };
  }

  var row = sheet.getRange(2, 1, 1, 3).getValues()[0];
  return {
    username: row[0] || DEFAULT_USERNAME,
    password: row[1] || DEFAULT_PASSWORD,
    lastUpdated: row[2] || new Date()
  };
}

/**
 * Set credentials in Credentials sheet
 */
function setCredentials(username, password) {
  var sheet = getSheet(SHEET_CREDS);

  // Ensure headers exist
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Username', 'Password', 'Last Updated']);
  }

  if (sheet.getLastRow() < 2) {
    sheet.appendRow([username, password, new Date()]);
  } else {
    sheet.getRange(2, 1, 1, 3).setValues([[username, password, new Date()]]);
  }
}

/**
 * Save old credentials to history
 */
function saveToHistory(oldUsername, oldPassword, newUsername) {
  var sheet = getSheet(SHEET_HISTORY);

  // Ensure headers exist
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Changed At', 'Old Username', 'Old Password', 'New Username']);
  }

  sheet.appendRow([new Date(), oldUsername, oldPassword, newUsername]);
}

// ===== HELPERS =====

function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);

  if (!sheet) {
    // Create sheet if doesn't exist
    sheet = ss.insertSheet(name);

    // Add headers for new sheets
    if (name === SHEET_CREDS) {
      sheet.appendRow(['Username', 'Password', 'Last Updated']);
    } else if (name === SHEET_HISTORY) {
      sheet.appendRow(['Changed At', 'Old Username', 'Old Password', 'New Username']);
    }
  }

  return sheet;
}

function sendNotificationEmail(data, msgId) {
  var recipient = Session.getActiveUser().getEmail();
  if (!recipient) return;

  var subject = 'New Portfolio Message from ' + (data.name || 'Visitor');
  var body =
    'You have a new message from your portfolio!\n\n' +
    '========================================\n\n' +
    'Name: ' + (data.name || 'N/A') + '\n' +
    'Email: ' + (data.email || 'N/A') + '\n' +
    'Phone: ' + (data.phone || 'N/A') + '\n' +
    'Project Type: ' + (data.projectType || 'N/A') + '\n\n' +
    'Message:\n' + (data.message || '') + '\n\n' +
    '========================================\n\n' +
    'ID: ' + msgId + '\n' +
    'Time: ' + new Date().toLocaleString() + '\n';

  MailApp.sendEmail(recipient, subject, body);
}

function sendPasswordChangeEmail(newUsername) {
  var recipient = Session.getActiveUser().getEmail();
  if (!recipient) return;

  var subject = '[Hanan Dashboard] Login Credentials Changed';
  var body =
    'Your dashboard login credentials were just changed.\n\n' +
    '========================================\n\n' +
    'New Username: ' + newUsername + '\n' +
    'Changed At: ' + new Date().toLocaleString() + '\n\n' +
    '========================================\n\n' +
    'If this was not you, change your credentials immediately!\n\n' +
    'Old passwords are stored in the "PasswordHistory" sheet.\n';

  MailApp.sendEmail(recipient, subject, body);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * HANAN PORTFOLIO - Full API v3
 * Messages + Credentials + Analytics + Projects + Testimonials
 */

// ===== CONFIG =====
var SHEET_MESSAGES = 'Sheet1';
var SHEET_CREDS = 'Credentials';
var SHEET_HISTORY = 'PasswordHistory';
var SHEET_ANALYTICS = 'Analytics';
var SHEET_PROJECTS = 'Projects';
var SHEET_TESTIMONIALS = 'Testimonials';
var SECRET_KEY = 'hanan_2026_secret';
var DEFAULT_USERNAME = 'hanan';
var DEFAULT_PASSWORD = 'hanan@2026';

// ===== ROUTING =====

function doGet(e) {
  try {
    var action = (e.parameter && e.parameter.action) || 'getMessages';

    if (action === 'getCreds') return getCurrentCredentials(e.parameter.secret);
    if (action === 'getAnalytics') return getAnalytics();
    if (action === 'getProjects') return getProjects();
    if (action === 'getTestimonials') return getTestimonials();

    return getMessages();
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    var data;
    if (e.postData && e.postData.type === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter || {};
    }

    // Routing
    if (data.action === 'updateStatus') return handleStatusUpdate(data);
    if (data.action === 'changeCreds') return changeCredentials(data);
    if (data.action === 'verifyLogin') return verifyLogin(data);
    if (data.action === 'trackVisit') return trackVisit(data);
    if (data.action === 'saveProject') return saveProject(data);
    if (data.action === 'deleteProject') return deleteProject(data);
    if (data.action === 'saveTestimonial') return saveTestimonial(data);
    if (data.action === 'deleteTestimonial') return deleteTestimonial(data);

    return saveMessage(data);
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

// ===== MESSAGES =====

function getMessages() {
  var sheet = getSheet(SHEET_MESSAGES);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse({ ok: true, count: 0, messages: [] });

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

  sheet.appendRow([
    new Date(),
    data.name.toString().substring(0, 200),
    data.email.toString().substring(0, 200),
    data.phone || '',
    data.projectType || '',
    data.message.toString().substring(0, 5000),
    'unread',
    msgId
  ]);

  try { sendNotificationEmail(data, msgId); } catch (e) { Logger.log(e); }
  return jsonResponse({ ok: true, id: msgId, message: 'Message received successfully!' });
}

function handleStatusUpdate(data) {
  if (data.secret !== SECRET_KEY) return jsonResponse({ ok: false, error: 'Unauthorized' });
  if (!data.id) return jsonResponse({ ok: false, error: 'Message ID required' });

  var sheet = getSheet(SHEET_MESSAGES);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse({ ok: false, error: 'No messages found' });

  var idColumn = sheet.getRange(2, 8, lastRow - 1, 1).getValues();
  var rowIndex = -1;

  for (var i = 0; i < idColumn.length; i++) {
    if (idColumn[i][0] === data.id) { rowIndex = i + 2; break; }
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

// ===== CREDENTIALS =====

function verifyLogin(data) {
  if (!data.username || !data.password) {
    return jsonResponse({ ok: false, error: 'Username and password required' });
  }
  var creds = getStoredCredentials();
  var inputUser = data.username.toString().trim().toLowerCase();
  var inputPass = data.password.toString();

  if (inputUser === creds.username.toLowerCase() && inputPass === creds.password) {
    return jsonResponse({ ok: true, username: creds.username, message: 'Login successful' });
  }
  return jsonResponse({ ok: false, error: 'Invalid username or password' });
}

function getCurrentCredentials(secret) {
  if (secret !== SECRET_KEY) return jsonResponse({ ok: false, error: 'Unauthorized' });
  var creds = getStoredCredentials();
  return jsonResponse({ ok: true, username: creds.username, password: creds.password });
}

function changeCredentials(data) {
  if (!data.currentPassword) return jsonResponse({ ok: false, error: 'Current password required' });

  var creds = getStoredCredentials();
  if (data.currentPassword !== creds.password) {
    return jsonResponse({ ok: false, error: 'Current password is incorrect' });
  }

  var newUsername = (data.newUsername || creds.username).toString().trim();
  var newPassword = (data.newPassword || '').toString();

  if (!newPassword || newPassword.length < 6) {
    return jsonResponse({ ok: false, error: 'New password must be at least 6 characters' });
  }
  if (!newUsername || newUsername.length < 3) {
    return jsonResponse({ ok: false, error: 'Username must be at least 3 characters' });
  }

  saveToHistory(creds.username, creds.password, newUsername);
  setCredentials(newUsername, newPassword);

  try { sendPasswordChangeEmail(newUsername); } catch (e) { Logger.log(e); }
  return jsonResponse({ ok: true, username: newUsername, message: 'Credentials updated' });
}

function getStoredCredentials() {
  var sheet = getSheet(SHEET_CREDS);
  if (sheet.getLastRow() === 0) sheet.appendRow(['Username', 'Password', 'Last Updated']);

  if (sheet.getLastRow() < 2) {
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

function setCredentials(username, password) {
  var sheet = getSheet(SHEET_CREDS);
  if (sheet.getLastRow() === 0) sheet.appendRow(['Username', 'Password', 'Last Updated']);

  if (sheet.getLastRow() < 2) {
    sheet.appendRow([username, password, new Date()]);
  } else {
    sheet.getRange(2, 1, 1, 3).setValues([[username, password, new Date()]]);
  }
}

function saveToHistory(oldUsername, oldPassword, newUsername) {
  var sheet = getSheet(SHEET_HISTORY);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Changed At', 'Old Username', 'Old Password', 'New Username']);
  }
  sheet.appendRow([new Date(), oldUsername, oldPassword, newUsername]);
}

// ===== ANALYTICS =====

function trackVisit(data) {
  var sheet = getSheet(SHEET_ANALYTICS);

  // Ensure headers
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Page', 'Device', 'Browser', 'OS', 'Country', 'Referrer', 'Session']);
  }

  sheet.appendRow([
    new Date(),
    (data.page || '/').toString().substring(0, 300),
    (data.device || 'unknown').toString().substring(0, 50),
    (data.browser || 'unknown').toString().substring(0, 50),
    (data.os || 'unknown').toString().substring(0, 50),
    (data.country || 'unknown').toString().substring(0, 100),
    (data.referrer || 'direct').toString().substring(0, 300),
    (data.session || '').toString().substring(0, 50)
  ]);

  return jsonResponse({ ok: true, message: 'Visit tracked' });
}

function getAnalytics() {
  var sheet = getSheet(SHEET_ANALYTICS);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse({ ok: true, count: 0, visits: [] });

  var range = sheet.getRange(2, 1, lastRow - 1, 8);
  var values = range.getValues();

  var visits = values.map(function (row) {
    return {
      timestamp: row[0] ? new Date(row[0]).toISOString() : null,
      page: row[1] || '/',
      device: row[2] || 'unknown',
      browser: row[3] || 'unknown',
      os: row[4] || 'unknown',
      country: row[5] || 'unknown',
      referrer: row[6] || 'direct',
      session: row[7] || ''
    };
  }).reverse();

  return jsonResponse({ ok: true, count: visits.length, visits: visits });
}

// ===== PROJECTS =====

function getProjects() {
  var sheet = getSheet(SHEET_PROJECTS);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'Title', 'Category', 'Description', 'Image URL', 'Live URL', 'Tech', 'Color', 'Created At']);
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse({ ok: true, count: 0, projects: [] });

  var range = sheet.getRange(2, 1, lastRow - 1, 9);
  var values = range.getValues();

  var projects = values.map(function (row) {
    return {
      id: row[0] || '',
      title: row[1] || '',
      category: row[2] || '',
      description: row[3] || '',
      imageUrl: row[4] || '',
      liveUrl: row[5] || '',
      tech: row[6] || '',
      color: row[7] || '#f9ca24',
      createdAt: row[8] ? new Date(row[8]).toISOString() : null
    };
  });

  return jsonResponse({ ok: true, count: projects.length, projects: projects });
}

function saveProject(data) {
  if (data.secret !== SECRET_KEY) return jsonResponse({ ok: false, error: 'Unauthorized' });
  if (!data.title) return jsonResponse({ ok: false, error: 'Title required' });

  var sheet = getSheet(SHEET_PROJECTS);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'Title', 'Category', 'Description', 'Image URL', 'Live URL', 'Tech', 'Color', 'Created At']);
  }

  var id = data.id || ('proj_' + Date.now());

  // Check if updating existing
  if (data.id) {
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < idColumn.length; i++) {
        if (idColumn[i][0] === data.id) {
          sheet.getRange(i + 2, 1, 1, 9).setValues([[
            id,
            data.title.toString().substring(0, 200),
            data.category || '',
            (data.description || '').toString().substring(0, 1000),
            data.imageUrl || '',
            data.liveUrl || '',
            data.tech || '',
            data.color || '#f9ca24',
            new Date()
          ]]);
          return jsonResponse({ ok: true, id: id, action: 'updated' });
        }
      }
    }
  }

  // Add new
  sheet.appendRow([
    id,
    data.title.toString().substring(0, 200),
    data.category || '',
    (data.description || '').toString().substring(0, 1000),
    data.imageUrl || '',
    data.liveUrl || '',
    data.tech || '',
    data.color || '#f9ca24',
    new Date()
  ]);

  return jsonResponse({ ok: true, id: id, action: 'created' });
}

function deleteProject(data) {
  if (data.secret !== SECRET_KEY) return jsonResponse({ ok: false, error: 'Unauthorized' });
  if (!data.id) return jsonResponse({ ok: false, error: 'Project ID required' });

  var sheet = getSheet(SHEET_PROJECTS);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse({ ok: false, error: 'No projects found' });

  var idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < idColumn.length; i++) {
    if (idColumn[i][0] === data.id) {
      sheet.deleteRow(i + 2);
      return jsonResponse({ ok: true, action: 'deleted' });
    }
  }

  return jsonResponse({ ok: false, error: 'Project not found' });
}

// ===== TESTIMONIALS =====

function getTestimonials() {
  var sheet = getSheet(SHEET_TESTIMONIALS);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'Name', 'Role', 'Company', 'Message', 'Rating', 'Avatar', 'Featured', 'Created At']);
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse({ ok: true, count: 0, testimonials: [] });

  var range = sheet.getRange(2, 1, lastRow - 1, 9);
  var values = range.getValues();

  var testimonials = values.map(function (row) {
    return {
      id: row[0] || '',
      name: row[1] || '',
      role: row[2] || '',
      company: row[3] || '',
      message: row[4] || '',
      rating: parseInt(row[5]) || 5,
      avatar: row[6] || '',
      featured: row[7] === 'yes' || row[7] === true,
      createdAt: row[8] ? new Date(row[8]).toISOString() : null
    };
  });

  return jsonResponse({ ok: true, count: testimonials.length, testimonials: testimonials });
}

function saveTestimonial(data) {
  if (data.secret !== SECRET_KEY) return jsonResponse({ ok: false, error: 'Unauthorized' });
  if (!data.name || !data.message) return jsonResponse({ ok: false, error: 'Name and message required' });

  var sheet = getSheet(SHEET_TESTIMONIALS);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'Name', 'Role', 'Company', 'Message', 'Rating', 'Avatar', 'Featured', 'Created At']);
  }

  var id = data.id || ('test_' + Date.now());

  if (data.id) {
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < idColumn.length; i++) {
        if (idColumn[i][0] === data.id) {
          sheet.getRange(i + 2, 1, 1, 9).setValues([[
            id,
            data.name.toString().substring(0, 200),
            data.role || '',
            data.company || '',
            data.message.toString().substring(0, 2000),
            parseInt(data.rating) || 5,
            data.avatar || '',
            data.featured ? 'yes' : 'no',
            new Date()
          ]]);
          return jsonResponse({ ok: true, id: id, action: 'updated' });
        }
      }
    }
  }

  sheet.appendRow([
    id,
    data.name.toString().substring(0, 200),
    data.role || '',
    data.company || '',
    data.message.toString().substring(0, 2000),
    parseInt(data.rating) || 5,
    data.avatar || '',
    data.featured ? 'yes' : 'no',
    new Date()
  ]);

  return jsonResponse({ ok: true, id: id, action: 'created' });
}

function deleteTestimonial(data) {
  if (data.secret !== SECRET_KEY) return jsonResponse({ ok: false, error: 'Unauthorized' });
  if (!data.id) return jsonResponse({ ok: false, error: 'Testimonial ID required' });

  var sheet = getSheet(SHEET_TESTIMONIALS);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse({ ok: false, error: 'No testimonials found' });

  var idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < idColumn.length; i++) {
    if (idColumn[i][0] === data.id) {
      sheet.deleteRow(i + 2);
      return jsonResponse({ ok: true, action: 'deleted' });
    }
  }

  return jsonResponse({ ok: false, error: 'Testimonial not found' });
}

// ===== HELPERS =====

function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === SHEET_CREDS) sheet.appendRow(['Username', 'Password', 'Last Updated']);
    else if (name === SHEET_HISTORY) sheet.appendRow(['Changed At', 'Old Username', 'Old Password', 'New Username']);
    else if (name === SHEET_ANALYTICS) sheet.appendRow(['Timestamp', 'Page', 'Device', 'Browser', 'OS', 'Country', 'Referrer', 'Session']);
    else if (name === SHEET_PROJECTS) sheet.appendRow(['ID', 'Title', 'Category', 'Description', 'Image URL', 'Live URL', 'Tech', 'Color', 'Created At']);
    else if (name === SHEET_TESTIMONIALS) sheet.appendRow(['ID', 'Name', 'Role', 'Company', 'Message', 'Rating', 'Avatar', 'Featured', 'Created At']);
  }
  return sheet;
}

function sendNotificationEmail(data, msgId) {
  var recipient = Session.getActiveUser().getEmail();
  if (!recipient) return;
  var subject = 'New Portfolio Message from ' + (data.name || 'Visitor');
  var body = 'New message!\n\nName: ' + data.name + '\nEmail: ' + data.email +
             '\nPhone: ' + (data.phone || 'N/A') + '\nProject: ' + (data.projectType || 'N/A') +
             '\n\nMessage:\n' + data.message + '\n\nID: ' + msgId;
  MailApp.sendEmail(recipient, subject, body);
}

function sendPasswordChangeEmail(newUsername) {
  var recipient = Session.getActiveUser().getEmail();
  if (!recipient) return;
  var subject = '[Hanan Dashboard] Login Credentials Changed';
  var body = 'Your dashboard credentials were changed.\n\nNew Username: ' + newUsername +
             '\nTime: ' + new Date().toLocaleString() +
             '\n\nIf this was not you, change immediately!';
  MailApp.sendEmail(recipient, subject, body);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

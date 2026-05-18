/**
 * HANAN PORTFOLIO - Full API v4
 * Messages + Credentials + Analytics + Projects + Testimonials + SITE SETTINGS
 *
 * NEW IN V4:
 * - getSiteSettings / saveSiteSettings (Hero, About, Contact, Social)
 * - getSectionVisibility / saveSectionVisibility
 * - Single source of truth for entire website
 */

// ===== CONFIG =====
var SHEET_MESSAGES = 'Sheet1';
var SHEET_CREDS = 'Credentials';
var SHEET_HISTORY = 'PasswordHistory';
var SHEET_ANALYTICS = 'Analytics';
var SHEET_PROJECTS = 'Projects';
var SHEET_TESTIMONIALS = 'Testimonials';
var SHEET_SETTINGS = 'SiteSettings';
var SHEET_SECTIONS = 'SectionVisibility';
var SHEET_SKILLS = 'Skills';
var SHEET_WHATSNEW = 'WhatsNew';

var SECRET_KEY = 'hanan_2026_secret';
var DEFAULT_USERNAME = 'hanan';
var DEFAULT_PASSWORD = 'hanan@2026';

// Default site settings (used on first load)
var DEFAULT_SETTINGS = {
  // Hero
  hero_name: 'Abdul Hanan',
  hero_tagline: 'WordPress Developer & Shopify Designer',
  hero_subtitle: 'Building modern, professional websites that grow your business',
  hero_cta_text: 'Get In Touch',
  hero_cta_link: '#contact',
  hero_avatar: '',

  // About
  about_title: 'About Me',
  about_description: 'Passionate WordPress Developer and Shopify Designer based in Lahore, Pakistan. Currently working at CNC Electric Pakistan and pursuing BS Computer Science at Virtual University.',
  about_years: '2',
  about_projects: '6',
  about_clients: '5',
  about_satisfaction: '100',

  // Contact
  contact_email: 'abdulhanan4145534@gmail.com',
  contact_phone: '+92 325 4145534',
  contact_whatsapp: '923254145534',
  contact_location: 'Lahore, Pakistan',
  contact_availability: 'available', // 'available' | 'busy' | 'unavailable'

  // Social
  social_github: 'https://github.com/Hanan-develop',
  social_linkedin: 'https://www.linkedin.com/in/abdul-hanan-926a4b39a/',
  social_youtube: 'https://www.youtube.com/@CodeLabCreations_5345',
  social_twitter: '',
  social_instagram: '',
  social_facebook: ''
};

// Default section visibility
var DEFAULT_VISIBILITY = {
  section_hero: 'on',
  section_about: 'on',
  section_skills: 'on',
  section_services: 'on',
  section_projects: 'on',
  section_testimonials: 'on',
  section_education: 'on',
  section_achievements: 'on',
  section_whatsnew: 'on',
  section_faq: 'on',
  section_contact: 'on'
};

// ===== ROUTING =====

function doGet(e) {
  try {
    var action = (e.parameter && e.parameter.action) || 'getMessages';

    if (action === 'getCreds') return getCurrentCredentials(e.parameter.secret);
    if (action === 'getAnalytics') return getAnalytics();
    if (action === 'getProjects') return getProjects();
    if (action === 'getTestimonials') return getTestimonials();
    if (action === 'getSiteSettings') return getSiteSettings();
    if (action === 'getSectionVisibility') return getSectionVisibility();
    if (action === 'getSkills') return getSkills();
    if (action === 'getWhatsNew') return getWhatsNew();
    if (action === 'getAllData') return getAllData(); // For portfolio site (1 call gets everything)

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

    if (data.action === 'updateStatus') return handleStatusUpdate(data);
    if (data.action === 'changeCreds') return changeCredentials(data);
    if (data.action === 'verifyLogin') return verifyLogin(data);
    if (data.action === 'trackVisit') return trackVisit(data);
    if (data.action === 'saveProject') return saveProject(data);
    if (data.action === 'deleteProject') return deleteProject(data);
    if (data.action === 'saveTestimonial') return saveTestimonial(data);
    if (data.action === 'deleteTestimonial') return deleteTestimonial(data);
    if (data.action === 'saveSiteSettings') return saveSiteSettings(data);
    if (data.action === 'saveSectionVisibility') return saveSectionVisibility(data);
    if (data.action === 'saveSkill') return saveSkill(data);
    if (data.action === 'deleteSkill') return deleteSkill(data);
    if (data.action === 'saveWhatsNew') return saveWhatsNew(data);
    if (data.action === 'deleteWhatsNew') return deleteWhatsNew(data);

    return saveMessage(data);
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

// ===== UNIFIED DATA ENDPOINT (For Portfolio Site) =====

function getAllData() {
  // Returns everything portfolio needs in 1 call (faster, fewer requests)
  // Get skills
  var skillsSheet = getSheet(SHEET_SKILLS);
  var skills = [];
  if (skillsSheet.getLastRow() >= 2) {
    var sVals = skillsSheet.getRange(2, 1, skillsSheet.getLastRow() - 1, 7).getValues();
    skills = sVals.map(function (row) {
      return {
        id: row[0] || '', name: row[1] || '', category: row[2] || '',
        icon: row[3] || 'fa-code', color: row[4] || '#f9ca24',
        level: row[5] || 'Intermediate', percent: parseInt(row[6]) || 50
      };
    });
  }

  // Get whatsnew
  var wnSheet = getSheet(SHEET_WHATSNEW);
  var updates = [];
  if (wnSheet.getLastRow() >= 2) {
    var wVals = wnSheet.getRange(2, 1, wnSheet.getLastRow() - 1, 6).getValues();
    updates = wVals.map(function (row) {
      return {
        id: row[0] || '', title: row[1] || '', tag: row[2] || '',
        description: row[3] || '', date: row[4] ? new Date(row[4]).toISOString() : null,
        link: row[5] || ''
      };
    });
  }

  return jsonResponse({
    ok: true,
    settings: getStoredSettings(),
    visibility: getStoredVisibility(),
    projects: getStoredProjects(),
    testimonials: getStoredTestimonials(),
    skills: skills,
    whatsnew: updates
  });
}

function getStoredProjects() {
  var sheet = getSheet(SHEET_PROJECTS);
  if (sheet.getLastRow() < 2) return [];

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
  return values.map(function (row) {
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
}

function getStoredTestimonials() {
  var sheet = getSheet(SHEET_TESTIMONIALS);
  if (sheet.getLastRow() < 2) return [];

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
  return values.map(function (row) {
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
}

// ===== SITE SETTINGS =====

function getSiteSettings() {
  return jsonResponse({ ok: true, settings: getStoredSettings() });
}

function getStoredSettings() {
  var sheet = getSheet(SHEET_SETTINGS);

  // Ensure headers
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Key', 'Value', 'Updated At']);
  }

  var lastRow = sheet.getLastRow();
  var settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); // Clone

  if (lastRow >= 2) {
    var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    values.forEach(function (row) {
      if (row[0]) settings[row[0]] = row[1] || '';
    });
  }

  return settings;
}

function saveSiteSettings(data) {
  if (data.secret !== SECRET_KEY) {
    return jsonResponse({ ok: false, error: 'Unauthorized' });
  }

  var sheet = getSheet(SHEET_SETTINGS);

  // Ensure headers
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Key', 'Value', 'Updated At']);
  }

  // Get all keys from data (excluding action, secret)
  var keysToSave = {};
  for (var key in data) {
    if (key !== 'action' && key !== 'secret' && data[key] !== undefined) {
      keysToSave[key] = data[key];
    }
  }

  // Get existing data
  var lastRow = sheet.getLastRow();
  var existingKeys = {};

  if (lastRow >= 2) {
    var existingValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    existingValues.forEach(function (row, i) {
      if (row[0]) existingKeys[row[0]] = i + 2; // Row number
    });
  }

  // Update or insert each key
  var now = new Date();
  for (var settingKey in keysToSave) {
    var value = keysToSave[settingKey];
    if (existingKeys[settingKey]) {
      // Update existing
      sheet.getRange(existingKeys[settingKey], 2, 1, 2).setValues([[value, now]]);
    } else {
      // Insert new
      sheet.appendRow([settingKey, value, now]);
    }
  }

  return jsonResponse({ ok: true, message: 'Settings updated', count: Object.keys(keysToSave).length });
}

// ===== SECTION VISIBILITY =====

function getSectionVisibility() {
  return jsonResponse({ ok: true, visibility: getStoredVisibility() });
}

function getStoredVisibility() {
  var sheet = getSheet(SHEET_SECTIONS);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Section', 'Visible', 'Updated At']);

    // Initialize with defaults
    for (var key in DEFAULT_VISIBILITY) {
      sheet.appendRow([key, DEFAULT_VISIBILITY[key], new Date()]);
    }
  }

  var lastRow = sheet.getLastRow();
  var visibility = JSON.parse(JSON.stringify(DEFAULT_VISIBILITY));

  if (lastRow >= 2) {
    var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    values.forEach(function (row) {
      if (row[0]) visibility[row[0]] = row[1] || 'on';
    });
  }

  return visibility;
}

function saveSectionVisibility(data) {
  if (data.secret !== SECRET_KEY) {
    return jsonResponse({ ok: false, error: 'Unauthorized' });
  }

  var sheet = getSheet(SHEET_SECTIONS);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Section', 'Visible', 'Updated At']);
  }

  var keysToSave = {};
  for (var key in data) {
    if (key !== 'action' && key !== 'secret' && data[key] !== undefined && key.indexOf('section_') === 0) {
      keysToSave[key] = data[key];
    }
  }

  var lastRow = sheet.getLastRow();
  var existingKeys = {};

  if (lastRow >= 2) {
    var existingValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    existingValues.forEach(function (row, i) {
      if (row[0]) existingKeys[row[0]] = i + 2;
    });
  }

  var now = new Date();
  for (var sectionKey in keysToSave) {
    var value = keysToSave[sectionKey];
    if (existingKeys[sectionKey]) {
      sheet.getRange(existingKeys[sectionKey], 2, 1, 2).setValues([[value, now]]);
    } else {
      sheet.appendRow([sectionKey, value, now]);
    }
  }

  return jsonResponse({ ok: true, message: 'Visibility updated' });
}

// ===== MESSAGES =====

function getMessages() {
  var sheet = getSheet(SHEET_MESSAGES);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse({ ok: true, count: 0, messages: [] });

  var values = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
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

  var values = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
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
  return jsonResponse({ ok: true, count: getStoredProjects().length, projects: getStoredProjects() });
}

function saveProject(data) {
  if (data.secret !== SECRET_KEY) return jsonResponse({ ok: false, error: 'Unauthorized' });
  if (!data.title) return jsonResponse({ ok: false, error: 'Title required' });

  var sheet = getSheet(SHEET_PROJECTS);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'Title', 'Category', 'Description', 'Image URL', 'Live URL', 'Tech', 'Color', 'Created At']);
  }

  var id = data.id || ('proj_' + Date.now());

  if (data.id) {
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < idColumn.length; i++) {
        if (idColumn[i][0] === data.id) {
          sheet.getRange(i + 2, 1, 1, 9).setValues([[
            id, data.title.toString().substring(0, 200), data.category || '',
            (data.description || '').toString().substring(0, 1000),
            data.imageUrl || '', data.liveUrl || '', data.tech || '',
            data.color || '#f9ca24', new Date()
          ]]);
          return jsonResponse({ ok: true, id: id, action: 'updated' });
        }
      }
    }
  }

  sheet.appendRow([
    id, data.title.toString().substring(0, 200), data.category || '',
    (data.description || '').toString().substring(0, 1000),
    data.imageUrl || '', data.liveUrl || '', data.tech || '',
    data.color || '#f9ca24', new Date()
  ]);

  return jsonResponse({ ok: true, id: id, action: 'created' });
}

function deleteProject(data) {
  if (data.secret !== SECRET_KEY) return jsonResponse({ ok: false, error: 'Unauthorized' });
  if (!data.id) return jsonResponse({ ok: false, error: 'ID required' });

  var sheet = getSheet(SHEET_PROJECTS);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse({ ok: false, error: 'No projects' });

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
  return jsonResponse({ ok: true, count: getStoredTestimonials().length, testimonials: getStoredTestimonials() });
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
            id, data.name.toString().substring(0, 200), data.role || '',
            data.company || '', data.message.toString().substring(0, 2000),
            parseInt(data.rating) || 5, data.avatar || '',
            data.featured ? 'yes' : 'no', new Date()
          ]]);
          return jsonResponse({ ok: true, id: id, action: 'updated' });
        }
      }
    }
  }

  sheet.appendRow([
    id, data.name.toString().substring(0, 200), data.role || '',
    data.company || '', data.message.toString().substring(0, 2000),
    parseInt(data.rating) || 5, data.avatar || '',
    data.featured ? 'yes' : 'no', new Date()
  ]);

  return jsonResponse({ ok: true, id: id, action: 'created' });
}

function deleteTestimonial(data) {
  if (data.secret !== SECRET_KEY) return jsonResponse({ ok: false, error: 'Unauthorized' });
  if (!data.id) return jsonResponse({ ok: false, error: 'ID required' });

  var sheet = getSheet(SHEET_TESTIMONIALS);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse({ ok: false, error: 'No testimonials' });

  var idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < idColumn.length; i++) {
    if (idColumn[i][0] === data.id) {
      sheet.deleteRow(i + 2);
      return jsonResponse({ ok: true, action: 'deleted' });
    }
  }
  return jsonResponse({ ok: false, error: 'Not found' });
}

// ===== SKILLS =====

function getSkills() {
  var sheet = getSheet(SHEET_SKILLS);
  if (sheet.getLastRow() < 2) return jsonResponse({ ok: true, count: 0, skills: [] });

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
  var skills = values.map(function (row) {
    return {
      id: row[0] || '',
      name: row[1] || '',
      category: row[2] || '',
      icon: row[3] || 'fa-code',
      color: row[4] || '#f9ca24',
      level: row[5] || 'Intermediate',
      percent: parseInt(row[6]) || 50
    };
  });

  return jsonResponse({ ok: true, count: skills.length, skills: skills });
}

function saveSkill(data) {
  if (data.secret !== SECRET_KEY) return jsonResponse({ ok: false, error: 'Unauthorized' });
  if (!data.name) return jsonResponse({ ok: false, error: 'Name required' });

  var sheet = getSheet(SHEET_SKILLS);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'Name', 'Category', 'Icon', 'Color', 'Level', 'Percent']);
  }

  var id = data.id || ('skill_' + Date.now());

  if (data.id) {
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < idColumn.length; i++) {
        if (idColumn[i][0] === data.id) {
          sheet.getRange(i + 2, 1, 1, 7).setValues([[
            id, data.name.toString().substring(0, 100),
            data.category || '', data.icon || 'fa-code',
            data.color || '#f9ca24', data.level || 'Intermediate',
            parseInt(data.percent) || 50
          ]]);
          return jsonResponse({ ok: true, id: id, action: 'updated' });
        }
      }
    }
  }

  sheet.appendRow([
    id, data.name.toString().substring(0, 100),
    data.category || '', data.icon || 'fa-code',
    data.color || '#f9ca24', data.level || 'Intermediate',
    parseInt(data.percent) || 50
  ]);

  return jsonResponse({ ok: true, id: id, action: 'created' });
}

function deleteSkill(data) {
  if (data.secret !== SECRET_KEY) return jsonResponse({ ok: false, error: 'Unauthorized' });
  if (!data.id) return jsonResponse({ ok: false, error: 'ID required' });

  var sheet = getSheet(SHEET_SKILLS);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse({ ok: false, error: 'No skills' });

  var idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < idColumn.length; i++) {
    if (idColumn[i][0] === data.id) {
      sheet.deleteRow(i + 2);
      return jsonResponse({ ok: true, action: 'deleted' });
    }
  }
  return jsonResponse({ ok: false, error: 'Not found' });
}

// ===== WHATSNEW =====

function getWhatsNew() {
  var sheet = getSheet(SHEET_WHATSNEW);
  if (sheet.getLastRow() < 2) return jsonResponse({ ok: true, count: 0, updates: [] });

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  var updates = values.map(function (row) {
    return {
      id: row[0] || '',
      title: row[1] || '',
      tag: row[2] || '',
      description: row[3] || '',
      date: row[4] ? new Date(row[4]).toISOString() : null,
      link: row[5] || ''
    };
  });

  return jsonResponse({ ok: true, count: updates.length, updates: updates });
}

function saveWhatsNew(data) {
  if (data.secret !== SECRET_KEY) return jsonResponse({ ok: false, error: 'Unauthorized' });
  if (!data.title) return jsonResponse({ ok: false, error: 'Title required' });

  var sheet = getSheet(SHEET_WHATSNEW);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'Title', 'Tag', 'Description', 'Date', 'Link']);
  }

  var id = data.id || ('wn_' + Date.now());
  var dateValue = data.date ? new Date(data.date) : new Date();

  if (data.id) {
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < idColumn.length; i++) {
        if (idColumn[i][0] === data.id) {
          sheet.getRange(i + 2, 1, 1, 6).setValues([[
            id, data.title.toString().substring(0, 100),
            data.tag || '', data.description.toString().substring(0, 500),
            dateValue, data.link || ''
          ]]);
          return jsonResponse({ ok: true, id: id, action: 'updated' });
        }
      }
    }
  }

  sheet.appendRow([
    id, data.title.toString().substring(0, 100),
    data.tag || '', data.description.toString().substring(0, 500),
    dateValue, data.link || ''
  ]);

  return jsonResponse({ ok: true, id: id, action: 'created' });
}

function deleteWhatsNew(data) {
  if (data.secret !== SECRET_KEY) return jsonResponse({ ok: false, error: 'Unauthorized' });
  if (!data.id) return jsonResponse({ ok: false, error: 'ID required' });

  var sheet = getSheet(SHEET_WHATSNEW);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse({ ok: false, error: 'No updates' });

  var idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < idColumn.length; i++) {
    if (idColumn[i][0] === data.id) {
      sheet.deleteRow(i + 2);
      return jsonResponse({ ok: true, action: 'deleted' });
    }
  }
  return jsonResponse({ ok: false, error: 'Not found' });
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
    else if (name === SHEET_SETTINGS) sheet.appendRow(['Key', 'Value', 'Updated At']);
    else if (name === SHEET_SECTIONS) sheet.appendRow(['Section', 'Visible', 'Updated At']);
    else if (name === SHEET_SKILLS) sheet.appendRow(['ID', 'Name', 'Category', 'Icon', 'Color', 'Level', 'Percent']);
    else if (name === SHEET_WHATSNEW) sheet.appendRow(['ID', 'Title', 'Tag', 'Description', 'Date', 'Link']);
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
  MailApp.sendEmail(recipient, '[Hanan Dashboard] Credentials Changed',
    'Your dashboard credentials were changed.\nNew Username: ' + newUsername + '\nTime: ' + new Date().toLocaleString());
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

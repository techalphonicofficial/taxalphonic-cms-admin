export const settingsSchemas = {
  organization: {
    title: 'Organization Information',
    description: 'Basic details and branding for your organization.',
    fields: [
      { name: 'organizationName', label: 'Organization Name', type: 'text', placeholder: 'e.g. Acme Corp' },
      { name: 'shortName', label: 'Short Name', type: 'text', placeholder: 'e.g. Acme' },
      { name: 'tagline', label: 'Tagline', type: 'text', placeholder: 'e.g. Innovation at its finest' },
      { name: 'companyRegistrationNo', label: 'Company Registration No.', type: 'text', placeholder: 'e.g. U72200DL2021PTC123456' },
      { name: 'gstVatNumber', label: 'GST/VAT Number', type: 'text', placeholder: 'e.g. 07XXXXX1234X1Z5' },
      { name: 'panTaxId', label: 'PAN/TAX ID', type: 'text', placeholder: 'e.g. ABCDE1234F' },
      { name: 'foundedYear', label: 'Founded Year', type: 'number', placeholder: 'e.g. 2021' },
      { name: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g. Technology / Software' },
      { name: 'organizationType', label: 'Organization Type', type: 'text', placeholder: 'e.g. Private Limited' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'A brief description of your organization...' },
      { name: 'logo', label: 'Logo', type: 'text', example: '(Main logo; used wherever the light or dark logo is empty)' },
      { name: 'darkLogo', label: 'Dark Logo', type: 'text', example: '(Website header in dark mode)' },
      { name: 'lightLogo', label: 'Light Logo', type: 'text', example: '(Website header in light mode, and the footer logo badge)' },
      { name: 'favicon', label: 'Favicon', type: 'text', example: '(Website browser tab icon)' },
      { name: 'appleTouchIcon', label: 'Apple Touch Icon', type: 'text', example: '(Website icon on iPhone home screens)' },
      { name: 'emailLogo', label: 'Email Logo', type: 'text', example: '(URL or File Path)' },
      { name: 'invoiceLogo', label: 'Invoice Logo', type: 'text', example: '(URL or File Path)' },
      { name: 'watermarkLogo', label: 'Watermark Logo', type: 'text', example: '(URL or File Path)' },
    ]
  },
  contact: {
    title: 'Contact Information',
    description: 'Communication channels for your organization.',
    fields: [
      { name: 'supportEmail', label: 'Support Email', type: 'email', placeholder: 'e.g. support@example.com' },
      { name: 'salesEmail', label: 'Sales Email', type: 'email', placeholder: 'e.g. sales@example.com' },
      { name: 'hrEmail', label: 'HR Email', type: 'email', placeholder: 'e.g. hr@example.com' },
      { name: 'accountsEmail', label: 'Accounts Email', type: 'email', placeholder: 'e.g. billing@example.com' },
      { name: 'mobileNumber', label: 'Mobile Number', type: 'text', placeholder: 'e.g. +1 555-0198' },
      { name: 'alternateMobile', label: 'Alternate Mobile', type: 'text', placeholder: 'e.g. +1 555-0199' },
      { name: 'whatsappNumber', label: 'WhatsApp Number', type: 'text', placeholder: 'e.g. +1 555-0200' },
      { name: 'tollFreeNumber', label: 'Toll Free Number', type: 'text', placeholder: 'e.g. 1-800-123-4567' },
      { name: 'landline', label: 'Landline', type: 'text', placeholder: 'e.g. 011-12345678' },
      { name: 'faxNumber', label: 'Fax Number', type: 'text', placeholder: 'e.g. +1 555-0198' },
    ]
  },
  address: {
    title: 'Address Information',
    description: 'Physical location of your organization.',
    fields: [
      { name: 'addressLine1', label: 'Address Line 1', type: 'text', placeholder: 'e.g. 123 Business Rd' },
      { name: 'addressLine2', label: 'Address Line 2', type: 'text', placeholder: 'e.g. Suite 400' },
      { name: 'area', label: 'Area', type: 'text', placeholder: 'e.g. Downtown' },
      { name: 'city', label: 'City', type: 'text', placeholder: 'e.g. New York' },
      { name: 'district', label: 'District', type: 'text', placeholder: 'e.g. Manhattan' },
      { name: 'state', label: 'State', type: 'text', placeholder: 'e.g. New York' },
      { name: 'stateCode', label: 'State Code', type: 'text', placeholder: 'e.g. NY' },
      { name: 'country', label: 'Country', type: 'text', placeholder: 'e.g. United States' },
      { name: 'countryCode', label: 'Country Code', type: 'text', placeholder: 'e.g. US' },
      { name: 'zipPostalCode', label: 'ZIP/Postal Code', type: 'text', placeholder: 'e.g. 10001' },
      { name: 'googleMapUrl', label: 'Google Map URL', type: 'text', placeholder: 'e.g. https://goo.gl/maps/...' },
      { name: 'latitude', label: 'Latitude', type: 'text', placeholder: 'e.g. 40.7128' },
      { name: 'longitude', label: 'Longitude', type: 'text', placeholder: 'e.g. -74.0060' },
    ]
  },
  social: {
    title: 'Social Media',
    description: 'Links to your social media profiles.',
    fields: [
      { name: 'facebook', label: 'Facebook', type: 'text', placeholder: 'https://facebook.com/yourpage' },
      { name: 'instagram', label: 'Instagram', type: 'text', placeholder: 'https://instagram.com/yourprofile' },
      { name: 'linkedin', label: 'LinkedIn', type: 'text', placeholder: 'https://linkedin.com/company/yourcompany' },
      { name: 'twitterX', label: 'Twitter/X', type: 'text', placeholder: 'https://twitter.com/yourhandle' },
      { name: 'youtube', label: 'YouTube', type: 'text', placeholder: 'https://youtube.com/c/yourchannel' },
      { name: 'pinterest', label: 'Pinterest', type: 'text', placeholder: 'https://pinterest.com/yourprofile' },
      { name: 'telegram', label: 'Telegram', type: 'text', placeholder: 'https://t.me/yourchannel' },
      { name: 'whatsappLink', label: 'WhatsApp', type: 'text', placeholder: 'https://wa.me/15550198' },
      { name: 'threads', label: 'Threads', type: 'text', placeholder: 'https://threads.net/@yourhandle' },
      { name: 'tumblr', label: 'Tumblr', type: 'text', placeholder: 'https://yourblog.tumblr.com' },
    ]
  },
  website: {
    title: 'Website Settings',
    description: 'Core configuration for your website.',
    fields: [
      { name: 'websiteName', label: 'Website Name', type: 'text', placeholder: 'e.g. Acme Online' },
      { name: 'websiteUrl', label: 'Website URL', type: 'text', placeholder: 'https://www.example.com' },
      { name: 'adminUrl', label: 'Admin URL', type: 'text', placeholder: 'https://admin.example.com' },
      { name: 'defaultLanguage', label: 'Default Language', type: 'text', placeholder: 'e.g. en' },
      { name: 'defaultCurrency', label: 'Default Currency', type: 'text', placeholder: 'e.g. USD' },
      { name: 'timezone', label: 'Timezone', type: 'text', placeholder: 'e.g. America/New_York' },
      { name: 'dateFormat', label: 'Date Format', type: 'text', placeholder: 'e.g. YYYY-MM-DD' },
      { name: 'timeFormat', label: 'Time Format', type: 'text', placeholder: 'e.g. HH:mm:ss' },
      { name: 'maintenanceMode', label: 'Maintenance Mode', type: 'switch' },
      { name: 'offlineMessage', label: 'Offline Message', type: 'textarea' },
    ]
  },
  seo: {
    title: 'SEO Settings',
    description: 'Search engine optimization defaults.',
    fields: [
      { name: 'metaTitle', label: 'Meta Title', type: 'text', placeholder: 'Enter the default page title for search engines', fullWidth: true },
      { name: 'metaDescription', label: 'Meta Description', type: 'textarea', placeholder: 'Enter the default description for search engines...' },
      { name: 'keywords', label: 'Keywords', type: 'text', placeholder: 'e.g. software, technology, services' },
      { name: 'canonicalUrl', label: 'Canonical URL', type: 'text', placeholder: 'https://www.example.com' },
      { name: 'robots', label: 'Robots', type: 'text' },
      { name: 'googleVerification', label: 'Google Verification', type: 'text' },
      { name: 'bingVerification', label: 'Bing Verification', type: 'text' },
      { name: 'facebookVerification', label: 'Facebook Verification', type: 'text' },
      { name: 'openGraphImage', label: 'Open Graph Image', type: 'text' },
      { name: 'twitterCardImage', label: 'Twitter Card Image', type: 'text' },
      { name: 'schemaJsonLd', label: 'Schema JSON-LD', type: 'textarea' },
      { name: 'otherMetaTags', label: 'Other Meta Tags (Raw HTML)', type: 'textarea', placeholder: 'Enter any custom <meta>, <script> or verification tags here' },
    ]
  },
  smtp: {
    title: 'Email (SMTP)',
    description: 'Configuration for sending emails.',
    fields: [
      { name: 'mailDriver', label: 'Mail Driver', type: 'text' },
      { name: 'smtpHost', label: 'SMTP Host', type: 'text' },
      { name: 'smtpPort', label: 'SMTP Port', type: 'number' },
      { name: 'smtpUsername', label: 'SMTP Username', type: 'text' },
      { name: 'smtpPassword', label: 'SMTP Password', type: 'password' },
      { name: 'encryption', label: 'Encryption', type: 'text' },
      { name: 'fromName', label: 'From Name', type: 'text' },
      { name: 'fromEmail', label: 'From Email', type: 'email' },
      { name: 'replyToEmail', label: 'Reply-To Email', type: 'email' },
    ]
  },
  'sms-whatsapp': {
    title: 'SMS / WhatsApp',
    description: 'Settings for SMS and WhatsApp messaging.',
    fields: [
      { name: 'provider', label: 'Provider', type: 'text' },
      { name: 'apiKey', label: 'API Key', type: 'password' },
      { name: 'senderId', label: 'Sender ID', type: 'text' },
      { name: 'templateIds', label: 'Template IDs', type: 'textarea' },
      { name: 'whatsappApiToken', label: 'WhatsApp API Token', type: 'password' },
      { name: 'defaultCountryCode', label: 'Default Country Code', type: 'text' },
    ]
  },
  payment: {
    title: 'Payment Gateway',
    description: 'Configure available payment gateways.',
    fields: [
      { name: 'stripeHeading', label: 'Stripe', type: 'heading' },
      { name: 'stripePublishKey', label: 'Stripe Publish Key', type: 'text' },
      { name: 'stripeSecretKey', label: 'Stripe Secret Key', type: 'password' },
      { name: 'stripeWebhookSecret', label: 'Stripe Webhook Secret', type: 'password' },
      { name: 'stripeMode', label: 'Stripe Sandbox/Live Mode', type: 'switch' },

      { name: 'razorpayHeading', label: 'Razorpay', type: 'heading' },
      { name: 'razorpayPublishKey', label: 'Razorpay Publish Key', type: 'text' },
      { name: 'razorpaySecretKey', label: 'Razorpay Secret Key', type: 'password' },
      { name: 'razorpayWebhookSecret', label: 'Razorpay Webhook Secret', type: 'password' },
      { name: 'razorpayMode', label: 'Razorpay Sandbox/Live Mode', type: 'switch' },

      { name: 'paypalHeading', label: 'PayPal', type: 'heading' },
      { name: 'paypalPublishKey', label: 'PayPal Publish Key', type: 'text' },
      { name: 'paypalSecretKey', label: 'PayPal Secret Key', type: 'password' },
      { name: 'paypalMode', label: 'PayPal Sandbox/Live Mode', type: 'switch' },

      { name: 'payuHeading', label: 'PayU', type: 'heading' },
      { name: 'payuPublishKey', label: 'PayU Publish Key', type: 'text' },
      { name: 'payuSecretKey', label: 'PayU Secret Key', type: 'password' },
      { name: 'payuMode', label: 'PayU Sandbox/Live Mode', type: 'switch' },

      { name: 'phonepeHeading', label: 'PhonePe', type: 'heading' },
      { name: 'phonepeMerchantId', label: 'PhonePe Merchant ID', type: 'text' },
      { name: 'phonepeSaltKey', label: 'PhonePe Salt Key', type: 'password' },
      { name: 'phonepeSaltIndex', label: 'PhonePe Salt Index', type: 'text' },
      { name: 'phonepeMode', label: 'PhonePe Sandbox/Live Mode', type: 'switch' },

      { name: 'offlineHeading', label: 'Offline / Manual Payments', type: 'heading' },
      { name: 'cashOnDelivery', label: 'Enable Cash on Delivery', type: 'switch', halfWidth: true },
      { name: 'bankTransfer', label: 'Enable Bank Transfer', type: 'switch', halfWidth: true },
    ]
  },
  shipping: {
    title: 'Shipping',
    description: 'Configure shipping parameters.',
    fields: [
      { name: 'defaultWarehouse', label: 'Default Warehouse', type: 'text' },
      { name: 'shippingCharges', label: 'Shipping Charges', type: 'number' },
      { name: 'freeShippingLimit', label: 'Free Shipping Limit', type: 'number' },
      { name: 'deliveryTime', label: 'Delivery Time', type: 'text' },
      { name: 'packagingCharge', label: 'Packaging Charge', type: 'number' },
      { name: 'returnPeriod', label: 'Return Period', type: 'text' },
    ]
  },
  media: {
    title: 'Media Settings',
    description: 'Control media uploads and image processing.',
    fields: [
      { name: 'maxUploadSize', label: 'Max Upload Size', type: 'number' },
      { name: 'allowedFileTypes', label: 'Allowed File Types', type: 'text' },
      { name: 'defaultImage', label: 'Default Image', type: 'text' },
      { name: 'thumbnailSize', label: 'Thumbnail Size', type: 'text' },
      { name: 'mediumSize', label: 'Medium Size', type: 'text' },
      { name: 'largeSize', label: 'Large Size', type: 'text' },
      { name: 'webpConversion', label: 'WebP Conversion', type: 'switch' },
      { name: 'imageCompression', label: 'Image Compression', type: 'switch' },
      { name: 'lazyLoading', label: 'Lazy Loading', type: 'switch' },
    ]
  },
  security: {
    title: 'Security',
    description: 'System security and access policies.',
    fields: [
      { name: 'sessionTimeout', label: 'Session Timeout', type: 'number' },
      { name: 'loginAttempts', label: 'Login Attempts', type: 'number' },
      { name: 'googleRecaptchaKeys', label: 'Google reCAPTCHA Keys', type: 'text' },
      { name: 'twoFactorAuthentication', label: 'Two-Factor Authentication', type: 'switch' },
      { name: 'passwordPolicy', label: 'Password Policy', type: 'text' },
      { name: 'ipWhitelist', label: 'IP Whitelist', type: 'textarea' },
    ]
  },
  analytics: {
    title: 'Analytics & Tracking',
    description: 'Tracking identifiers and custom scripts.',
    fields: [
      { name: 'googleAnalyticsId', label: 'Google Analytics ID', type: 'text' },
      { name: 'googleTagManager', label: 'Google Tag Manager', type: 'text' },
      { name: 'metaPixel', label: 'Meta Pixel', type: 'text' },
      { name: 'linkedinInsightTag', label: 'LinkedIn Insight Tag', type: 'text' },
      { name: 'microsoftClarity', label: 'Microsoft Clarity', type: 'text' },
      { name: 'hotjar', label: 'Hotjar', type: 'text' },
      { name: 'customHeaderScript', label: 'Custom Header Script', type: 'textarea' },
      { name: 'customFooterScript', label: 'Custom Footer Script', type: 'textarea' },
    ]
  },
  invoice: {
    title: 'Invoice Settings',
    description: 'Formatting for system generated invoices.',
    fields: [
      { name: 'invoicePrefix', label: 'Invoice Prefix', type: 'text' },
      { name: 'startingNumber', label: 'Starting Number', type: 'number' },
      { name: 'currencySymbol', label: 'Currency Symbol', type: 'text' },
      { name: 'taxName', label: 'Tax Name', type: 'text' },
      { name: 'taxPercentage', label: 'Tax Percentage', type: 'number' },
      { name: 'footerNote', label: 'Footer Note', type: 'textarea' },
      { name: 'signature', label: 'Signature', type: 'text' },
      { name: 'qrCode', label: 'QR Code', type: 'text' },
    ]
  },
  notifications: {
    title: 'Notification Settings',
    description: 'Configure which notifications are enabled.',
    fields: [
      { name: 'emailNotifications', label: 'Email Notifications', type: 'switch' },
      { name: 'smsNotifications', label: 'SMS Notifications', type: 'switch' },
      { name: 'whatsappNotifications', label: 'WhatsApp Notifications', type: 'switch' },
      { name: 'pushNotifications', label: 'Push Notifications', type: 'switch' },
      { name: 'adminAlerts', label: 'Admin Alerts', type: 'switch' },
    ]
  },
  api: {
    title: 'API Settings',
    description: 'API access keys and settings.',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'text' },
      { name: 'secretKey', label: 'Secret Key', type: 'password' },
      { name: 'webhookUrl', label: 'Webhook URL', type: 'text' },
      { name: 'apiVersion', label: 'API Version', type: 'text' },
      { name: 'rateLimit', label: 'Rate Limit', type: 'number' },
    ]
  },
  backup: {
    title: 'Backup & Maintenance',
    description: 'System maintenance settings.',
    fields: [
      { name: 'autoBackup', label: 'Auto Backup', type: 'switch' },
      { name: 'backupFrequency', label: 'Backup Frequency', type: 'text' },
      { name: 'backupLocation', label: 'Backup Location', type: 'text' },
      { name: 'clearCache', label: 'Clear Cache (cron trigger)', type: 'switch' },
      { name: 'clearLogs', label: 'Clear Logs (cron trigger)', type: 'switch' },
      { name: 'optimizeDatabase', label: 'Optimize Database (cron trigger)', type: 'switch' },
    ]
  },
  'custom-code': {
    title: 'Custom Code',
    description: 'Custom code injections for the frontend.',
    fields: [
      { name: 'headerCss', label: 'Header CSS', type: 'textarea' },
      { name: 'footerCss', label: 'Footer CSS', type: 'textarea' },
      { name: 'customJavaScript', label: 'Custom JavaScript', type: 'textarea' },
      { name: 'headerHtml', label: 'Header HTML', type: 'textarea' },
      { name: 'footerHtml', label: 'Footer HTML', type: 'textarea' },
    ]
  },
  legal: {
    title: 'Legal Pages',
    description: 'URLs for your legal documentation.',
    fields: [
      { name: 'privacyPolicy', label: 'Privacy Policy', type: 'text' },
      { name: 'termsConditions', label: 'Terms & Conditions', type: 'text' },
      { name: 'refundPolicy', label: 'Refund Policy', type: 'text' },
      { name: 'shippingPolicy', label: 'Shipping Policy', type: 'text' },
      { name: 'cookiePolicy', label: 'Cookie Policy', type: 'text' },
      { name: 'disclaimer', label: 'Disclaimer', type: 'text' },
    ]
  },
  'system-info': {
    title: 'System Information (Read Only)',
    description: 'Overview of the current system environment.',
    fields: [
      { name: 'applicationVersion', label: 'Application Version', type: 'text', readOnly: true },
      { name: 'nodePhpVersion', label: 'Node.js/PHP Version', type: 'text', readOnly: true },
      { name: 'databaseVersion', label: 'Database Version', type: 'text', readOnly: true },
      { name: 'serverTime', label: 'Server Time', type: 'text', readOnly: true },
      { name: 'storageUsage', label: 'Storage Usage', type: 'text', readOnly: true },
      { name: 'environment', label: 'Environment', type: 'text', readOnly: true },
      { name: 'lastBackup', label: 'Last Backup', type: 'text', readOnly: true },
      { name: 'lastLogin', label: 'Last Login', type: 'text', readOnly: true },
      { name: 'recommendedAdminLayout', label: 'Recommended Admin Layout', type: 'text', readOnly: true },
    ]
  }
};

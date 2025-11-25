const fs = require('fs');
const path = require('path');

function layout(title, content, includeScript = false) {
  return `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="/output.css">
</head>
<body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-200">
  ${content}
  ${includeScript ? `
  <script>
    // Dark mode toggle
    function toggleDarkMode() {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
    }
    
    // Load dark mode preference
    if (localStorage.getItem('darkMode') === 'false') {
      document.documentElement.classList.remove('dark');
    }
  </script>
  ` : ''}
</body>
</html>
  `.trim();
}

// Login page
function loginPage(error = null) {
  const content = `
    <div class="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 animate-fade-in">
        <!-- Header -->
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <svg class="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h2 class="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            QR Director Login
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to manage your QR redirects
          </p>
        </div>

        <!-- Error message -->
        ${error ? `
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 animate-fade-in">
          <div class="flex">
            <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <p class="ml-3 text-sm text-red-800 dark:text-red-200">${error}</p>
          </div>
        </div>
        ` : ''}

        <!-- Login form -->
        <form method="post" action="/admin/login" class="mt-8 space-y-6">
          <div class="space-y-4">
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                class="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                class="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg class="h-5 w-5 text-white/80 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
              </svg>
            </span>
            Sign in
          </button>
        </form>
      </div>
    </div>
  `;

  return layout('Admin Login', content);
}

function adminPage(links) {
  const defaultUrl = links._default || 'https://www.google.com';
  const regularLinks = Object.entries(links).filter(([slug]) => slug !== '_default');

  const rows = regularLinks
    .map(([slug, url]) => `
      <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
        <td class="px-6 py-4">
          <code class="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm font-mono">
            ${slug}
          </code>
        </td>
        <td class="px-6 py-4">
          <a href="${url}" target="_blank" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline break-all">
            ${url}
          </a>
        </td>
        <td class="px-6 py-4">
          <div class="flex gap-2">
            <button
              type="button"
              onclick="editLink('${slug}', '${url.replace(/'/g, "\\'")}')"
              class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150"
            >
              <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Edit
            </button>
            <form method="post" action="/admin/delete" style="display:inline">
              <input type="hidden" name="slug" value="${slug}" />
              <button
                type="submit"
                onclick="return confirm('Are you sure you want to delete this link?')"
                class="inline-flex items-center px-3 py-1.5 border border-red-300 dark:border-red-800 text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-150"
              >
                <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Delete
              </button>
            </form>
          </div>
        </td>
      </tr>
    `)
    .join('');

  const content = `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center">
              <div class="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
                <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                </svg>
              </div>
              <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                QR Director
              </h1>
            </div>
            <div class="flex items-center gap-3">
              <button
                onclick="toggleDarkMode()"
                class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                title="Toggle dark mode"
              >
                <svg class="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
              </button>
              <a
                href="/admin/logout"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150"
              >
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Log out
              </a>
            </div>
          </div>
        </div>
      </header>

      <!-- Main content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="space-y-8">
          <!-- Default Redirect section -->
          <div class="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl shadow-lg border border-purple-200 dark:border-purple-800 overflow-hidden animate-fade-in">
            <div class="px-6 py-5 border-b border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-gray-800/50">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <svg class="h-6 w-6 mr-2 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                    Default Redirect
                  </h2>
                  <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Where users go when visiting your root domain (no slug)
                  </p>
                </div>
              </div>
            </div>
            <div class="px-6 py-6">
              <div class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div class="flex-1 mr-4">
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Current default URL:</p>
                  <a href="${defaultUrl}" target="_blank" class="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:underline break-all font-medium">
                    ${defaultUrl}
                  </a>
                </div>
                <button
                  type="button"
                  onclick="editDefault('${defaultUrl.replace(/'/g, "\\'")}')"
                  class="inline-flex items-center px-4 py-2 border border-purple-300 dark:border-purple-700 text-sm font-medium rounded-md text-purple-700 dark:text-purple-300 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-150 whitespace-nowrap"
                >
                  <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Edit Default
                </button>
              </div>
            </div>
          </div>

          <!-- Existing links section -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
            <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Existing Links
              </h2>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage your QR code redirects
              </p>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Slug
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Target URL
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  ${rows || `
                    <tr>
                      <td colspan="3" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                        </svg>
                        <p class="text-sm">No links yet. Create your first one below!</p>
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Create/Update form section -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
            <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Create / Update Link
              </h2>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Add a new QR redirect or update an existing one
              </p>
            </div>
            <form method="post" action="/admin/save" class="px-6 py-6">
              <div class="space-y-6">
                <div>
                  <label for="slug-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Slug
                  </label>
                  <input
                    type="text"
                    id="slug-input"
                    name="slug"
                    required
                    placeholder="e.g. q76hi"
                    class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                  />
                  <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    The short code that will appear in your QR URL
                  </p>
                </div>
                <div>
                  <label for="url-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target URL
                  </label>
                  <input
                    type="url"
                    id="url-input"
                    name="url"
                    required
                    placeholder="https://yourchurchsite.com/giving"
                    class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                  />
                  <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    The destination URL where users will be redirected
                  </p>
                </div>
                <div class="flex gap-3">
                  <button
                    type="submit"
                    class="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    Save Link
                  </button>
                  <button
                    type="button"
                    onclick="clearForm()"
                    class="px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-150"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>

    <script>
      function editLink(slug, url) {
        document.getElementById('slug-input').value = slug;
        document.getElementById('url-input').value = url;
        document.getElementById('slug-input').focus();
        
        // Smooth scroll to form
        const form = document.querySelector('form[action="/admin/save"]');
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add a subtle highlight effect
        form.parentElement.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
        setTimeout(() => {
          form.parentElement.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
        }, 2000);
      }
      
      function editDefault(url) {
        document.getElementById('slug-input').value = '_default';
        document.getElementById('url-input').value = url;
        document.getElementById('url-input').focus();
        
        // Smooth scroll to form
        const form = document.querySelector('form[action="/admin/save"]');
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add a subtle purple highlight effect for default
        form.parentElement.classList.add('ring-2', 'ring-purple-500', 'ring-opacity-50');
        setTimeout(() => {
          form.parentElement.classList.remove('ring-2', 'ring-purple-500', 'ring-opacity-50');
        }, 2000);
      }
      
      function clearForm() {
        document.getElementById('slug-input').value = '';
        document.getElementById('url-input').value = '';
        document.getElementById('slug-input').focus();
      }
    </script>
  `;

  return layout('QR Director Dashboard', content, true);
}

module.exports = {
  loginPage,
  adminPage,
};

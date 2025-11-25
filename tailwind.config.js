/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./views/**/*.js",
        "./app.js"
    ],
    darkMode: 'class',
    theme: {
        extend: {
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
}

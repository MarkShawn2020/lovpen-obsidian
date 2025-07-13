/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './index.html'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    // 动态颜色类名 - blue
    'bg-blue-50', 'bg-blue-100', 'bg-blue-200',
    'text-blue-700', 'text-blue-900',
    'border-blue-200',
    
    // 动态颜色类名 - purple  
    'bg-purple-50', 'bg-purple-100', 'bg-purple-200',
    'text-purple-700', 'text-purple-900', 
    'border-purple-200',
    
    // 其他可能的动态类名
    'bg-green-100', 'bg-green-200',
    'text-green-700',
    'bg-red-100', 'bg-red-200', 
    'text-red-700'
  ]
}
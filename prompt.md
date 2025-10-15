Project Title: FinZen - AI-Styled Financial Calculator PWA

Objective:
Create a single-file, mobile-first Progressive Web App (PWA) named "FinZen". The application should be built using only HTML, CSS, and JavaScript. The app will feature a "jazzy," AI-inspired user interface with a dark theme, neon accents, and minimal padding, optimized for a modern mobile experience. It must be deployable on GitHub Pages.

The core of the app will be a set of four financial calculators, each with dynamic charts to visualize the results:

Investment Calculator

Retirement Calculator

Mortgage Calculator (with Amortization)

Loan Calculator (with Amortization)

1. Design & UX/UI Specifications:

Overall Theme: Modern, sleek, "AI" aesthetic.

Color Palette: Dark mode primary. Use a deep charcoal or navy background (#1a1a2e). Use vibrant neon colors like electric blue (#00a8ff), magenta (#e040fb), or green (#00f5d4) for interactive elements, charts, and accents.

Typography: Use a clean, futuristic sans-serif font like 'Inter' or 'Poppins'.

Layout: Mobile-first is mandatory. The layout should be fluid and fill the screen with minimal padding and margins. Use a tab-based navigation system at the bottom or top to switch between the four calculators.

Animations: Implement smooth, subtle animations and transitions for tab switching, button clicks, and chart loading to enhance the "jazzy" feel.

Icons: Use modern, minimalist SVG icons for the navigation tabs.

2. Core Functionality - Calculators & Charts:

Each calculator should have its own section/tab with clear input fields and a dedicated area for displaying results and a chart. Use a charting library like Chart.js for all visualizations.

A. Investment Calculator:

Inputs:

Initial Investment ($)

Monthly Contribution ($)

Annual Interest Rate (%)

Investment Period (Years)

Outputs:

Future Value

Total Principal Contributed

Total Interest Earned

Chart: A line chart showing the growth of the investment over time. It should have two distinct lines: one for total principal contributed and one for the total portfolio value (principal + interest).

B. Retirement Calculator (401k/Roth):

Inputs:

Current Age

Target Retirement Age

Current Retirement Savings ($)

Monthly Contribution ($)

Annual Rate of Return (%)

Outputs:

Estimated Savings at Retirement

Chart: A bar or line chart projecting the total savings growth year-by-year until the target retirement age.

C. Mortgage Calculator:

Inputs:

Home Price ($)

Down Payment ($ or %)

Loan Term (e.g., 15, 30 years)

Annual Interest Rate (%)

Outputs:

Estimated Monthly Payment (Principal + Interest)

Total Amount Paid

Total Interest Paid

Amortization View: Below the main results, display a scrollable table or an interactive chart showing the amortization schedule (payment number, principal, interest, remaining balance). A pie chart visualizing Total Principal vs. Total Interest would also be a great addition.

D. Loan Calculator:

Inputs:

Loan Amount ($)

Loan Term (Years)

Annual Interest Rate (%)

Outputs:

Monthly Payment

Total Amount Paid

Total Interest Paid

Amortization View: Similar to the mortgage calculator, provide a clear amortization schedule view.

3. PWA (Progressive Web App) Requirements:

The application must function as a PWA, allowing users to "install" it on their mobile home screens.

Manifest File: Include a webmanifest file linked in the HTML head. It must specify:

name: "FinZen"

short_name: "FinZen"

start_url: "."

display: "standalone"

background_color: The dark theme background color.

theme_color: The primary neon accent color.

icons: Provide at least a 192x192 and a 512x512 icon. (You can use placeholder URLs for the icons if you cannot generate them).

Service Worker: Implement a basic service worker (sw.js) that caches the main application shell (index.html) for offline access. The JavaScript should correctly register this service worker.

4. Technical & Delivery Requirements:

Single File: All HTML, CSS, and JavaScript must be delivered in a single index.html file.

CSS should be within <style> tags in the <head>.

JavaScript should be within <script> tags before the closing </body> tag.

Dependencies: Use CDN links for any external libraries (e.g., Chart.js).

No Frameworks: Do not use any front-end frameworks like React, Angular, or Vue. This must be vanilla HTML, CSS, and JS.

Responsiveness: The app must look and function flawlessly on modern mobile devices.
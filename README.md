

# ATO: AI Tab Organizer

## Overview

Welcome to ATO, your AI-powered Tab Organizer! ATO intelligently manages and sorts your browser tabs, enhancing your browsing experience and improving your productivity. With ATO, you can effortlessly keep your tabs organized, ensuring you always find what you need when you need it.

## Features

### Two Ways to Use ATO

1. **By Demand**: With just a single click, you can organize all of your open tabs. This option is perfect for users who want a quick and easy way to declutter their workspace.

2. **Dynamically (On the Fly)**: Every time you open a new tab, ATO will automatically organize it the moment it’s created. This ensures that your tab management is always up to date without any extra effort on your part.

### Three Methods of Organization

ATO offers three intelligent methods to organize your tabs:

1. **By Category**: ATO categorizes your tabs based on their content. It analyzes the domain of each tab's URL to determine its category, and if the domain is unclear, it uses the tab's title to assist in classification. This helps you quickly locate related tabs based on their themes or topics.

2. **By Last Access**: This method organizes your tabs based on when you last accessed them. ATO groups your tabs into reasonable time frames, allowing you to easily revisit recently used tabs while keeping older ones accessible without cluttering your workspace.

3. **By Frequency (Prediction)**: ATO predicts which tabs you are most likely to access next based on your past behavior. By analyzing how often you’ve opened each tab, it sorts them in an order that prioritizes the most frequently accessed tabs, making your browsing experience smoother and more efficient.

## License

This project is licensed under the MIT License.








This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).

## Getting Started

First, run the development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

You can start editing the popup by modifying `popup.tsx`. It should auto-update as you make changes. To add an options page, simply add a `options.tsx` file to the root of the project, with a react component default exported. Likewise to add a content page, add a `content.ts` file to the root of the project, importing some module and do some logic, then reload the extension on your browser.

For further guidance, [visit our Documentation](https://docs.plasmo.com/)

## Making production build

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.

## Submit to the webstores

The easiest way to deploy your Plasmo extension is to use the built-in [bpp](https://bpp.browser.market) GitHub action. Prior to using this action however, make sure to build your extension and upload the first version to the store to establish the basic credentials. Then, simply follow [this setup instruction](https://docs.plasmo.com/framework/workflows/submit) and you should be on your way for automated submission!

# Kanban Board Application

A modern, feature-rich kanban board application built with Next.js 15, React 19, and TypeScript. Manage your tasks efficiently with drag-and-drop functionality, priority settings, and overdue task tracking.

## ✨ Features

### 📋 Board Management
- Create custom kanban boards with titles and descriptions
- Automatic default column generation (To Do, In Progress, Done)
- Individual board pages with persistent URLs

### 🎯 Task Management
- Create tasks with titles, descriptions, priorities, and due dates
- Priority levels: Low, Medium, High, Urgent with color coding
- Optional due date selection with date picker

### 🖱️ Drag & Drop
- Seamlessly move tasks between columns
- Reorder tasks within the same column
- Optimistic updates with error rollback
- Visual feedback during drag operations

### ⚠️ Overdue Task Tracking
- Visual highlighting of overdue tasks with red borders
- Warning icons and relative time display ("3日前に期限切れ")
- Column header badges showing overdue task counts

## 🚀 Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React
- **Data Storage**: JSON files with Server Actions
- **Deployment**: Ready for Vercel deployment

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

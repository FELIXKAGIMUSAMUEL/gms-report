/**
 * Example Usage of Offline Storage
 * 
 * This file demonstrates how to use the offline storage utilities
 * in your components to handle offline scenarios gracefully.
 */

import { 
  submitWithOfflineSupport, 
  getPendingCounts, 
  isOnline,
  cacheReport,
  getCachedReport 
} from '@/lib/offline-storage';

// Example 1: Submit a weekly report with offline support
async function submitWeeklyReport(reportData: any) {
  const result = await submitWithOfflineSupport(
    '/api/reports',
    reportData,
    'reports'
  );
  
  if (result.offline) {
    // Show user that data will sync when online
    alert('Report saved! It will be submitted when you\'re back online.');
  } else {
    // Report submitted successfully
    alert('Report submitted successfully!');
  }
}

// Example 2: Add a reaction with offline support
async function addReaction(sectionId: string, emoji: string) {
  const result = await submitWithOfflineSupport(
    '/api/reactions',
    { sectionId, emoji },
    'reactions'
  );
  
  if (result.offline) {
    console.log('Reaction queued for sync');
  } else {
    console.log('Reaction added successfully');
  }
}

// Example 3: Send a message with offline support
async function sendMessage(messageData: any) {
  const result = await submitWithOfflineSupport(
    '/api/messages',
    messageData,
    'messages'
  );
  
  return result;
}

// Example 4: Check pending counts
async function showPendingStatus() {
  const counts = await getPendingCounts();
  
  if (counts.reports > 0 || counts.reactions > 0 || counts.messages > 0) {
    console.log(`Pending items: ${counts.reports} reports, ${counts.reactions} reactions, ${counts.messages} messages`);
  }
}

// Example 5: Cache a report for offline viewing
async function cacheReportForOffline(reportId: string, data: any) {
  await cacheReport(reportId, data);
}

// Example 6: Get cached report when offline
async function loadReportOffline(reportId: string) {
  if (!isOnline()) {
    const cachedData = await getCachedReport(reportId);
    if (cachedData) {
      return cachedData;
    }
  }
  
  // Fetch from network if online or no cache
  const response = await fetch(`/api/reports/${reportId}`);
  const data = await response.json();
  
  // Cache for future offline access
  await cacheReport(reportId, data);
  
  return data;
}

// Example 7: React component with offline support
// import { useOnlineStatus } from '@/hooks/useOnlineStatus';
// 
// function ReportForm() {
//   const isOnline = useOnlineStatus();
//   
//   const handleSubmit = async (data: any) => {
//     const result = await submitWithOfflineSupport(
//       '/api/reports',
//       data,
//       'reports'
//     );
//     
//     if (result.offline) {
//       toast.info('Report saved offline. Will sync when connected.');
//     } else {
//       toast.success('Report submitted!');
//     }
//   };
//   
//   return (
//     <div>
//       {!isOnline && (
//         <div className="bg-amber-100 p-2 text-sm">
//           You're offline. Reports will be saved and synced later.
//         </div>
//       )}
//       <form onSubmit={handleSubmit}>
//         {/* form fields */}
//       </form>
//     </div>
//   );
// }

export {
  submitWeeklyReport,
  addReaction,
  sendMessage,
  showPendingStatus,
  cacheReportForOffline,
  loadReportOffline
};

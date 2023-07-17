const sdk = require('node-appwrite');

module.exports = async (req, res) => {
  const client = new sdk.Client();
  const databases = new sdk.Databases(client);
  const teams = new sdk.Teams(client);
  const users = new sdk.Users(client);

  client
    .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
    .setProject(req.variables.APPWRITE_ID) // Your project ID
    .setKey(req.variables.POST_CHATS_COMMENTS_TASKS_API_KEY) // Your secret API key
    ;

  try {
    const eventData = JSON.parse(req.variables.APPWRITE_FUNCTION_EVENT_DATA);
    const teamName = eventData.teamName;
    const team = eventData.team;
    const taskName = eventData.taskName;
    const assignee = eventData.assignee;
    const sender = eventData.sender;
    const taskId = eventData.$id;

    // Fetch sender name using the user API
    const senderResponse = await users.get(sender);
    const senderName = senderResponse.name;

    // Fetch assignee name using the user API
    const assigneeResponse = await users.get(assignee);
    const assigneeName = assigneeResponse.name;

    // Assign task to the assignee
    try {
      await databases.createDocument(
        req.variables.DATABASE_ID,
        req.variables.NEXT_PUBLIC_TASKS_NOTIFICATION_COLLECTION_ID,
        sdk.ID.unique(),
        {
          readerId: assignee,
          taskId,
          isRead: false,
          teamName,
          team,
          sender,
          sender_name: senderName,
          assignee,
          assignee_name: assigneeName,
          type: "ASSIGN",
          taskName
        },
        [
          sdk.Permission.read(sdk.Role.user(assignee)),
          sdk.Permission.update(sdk.Role.user(assignee)),
        ]
      );
    } catch (error) {
      console.error('Error creating notification:', error);
    }

    res.json({
      success: true,
      message: 'Created notification',
      eventData,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.json({ success: false, error: error.message });
  }
};

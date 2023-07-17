const sdk = require('node-appwrite');

module.exports = async (req, res) => {
  const client = new sdk.Client();

  const teams = new sdk.Teams(client);
  const databases = new sdk.Databases(client);
  client
    .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
    .setProject(req.variables.APPWRITE_ID) // Your project ID
    .setKey(req.variables.CREATE_GROUP_CHAT_NOTIFICATIONS_API_KEY) // Your secret API key
    ;

  try {
    const eventData = JSON.parse(req.variables.APPWRITE_FUNCTION_EVENT_DATA);
    const sender = eventData.sender;
    const teamId = eventData.team;
    const messageId = eventData.$id;

    // List all team members
    const membersList = await teams.listMemberships(String(teamId));
    const memberIds = membersList.memberships.map((member) => member.userId);
    const memberNames = membersList.memberships.map((member) => member.userName);

    // Loop through each member
    for (let i = 0; i < memberIds.length; i++) {
      const userId = memberIds[i];
      const userName = memberNames[i];

      if (userId === sender) {
        // Skip creating document for the sender
        continue;
      }

      try {
        const response = await databases.getDocument(
          process.env.DATABASE_ID,
          process.env.TEAMS_PREFERENCE_COLLECTION_ID,
          teamId
        );

        await databases.createDocument(
          req.variables.DATABASE_ID,
          req.variables.GROUP_CHAT_NOTIFICATIONS_COLLECTION_ID,
          sdk.ID.unique(),
          {
            sender: sender,
            isRead: false,
            messageId: messageId,
            readerId: userId,
            readerName: userName,
            teamId: teamId,
            teamName: response.name,
          },
          [
            sdk.Permission.read(sdk.Role.user(sender)),
            sdk.Permission.read(sdk.Role.user(userId)),
            sdk.Permission.update(sdk.Role.user(userId)),
          ]
        );
      } catch (error) {
        console.error('Error creating notification:', error);
      }
    }

    res.json({
      success: true,
      message: 'created all notifications',
    });
  } catch (error) {
    console.error('Error creating notifications:', error);
    res.json({ success: false, error: error.message });
  }
};

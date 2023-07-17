const sdk = require('node-appwrite');

module.exports = async (req, res) => {
  const client = new sdk.Client();
  const databases = new sdk.Databases(client);
  client
    .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
    .setProject(req.variables.APPWRITE_ID) // Your project ID
    .setKey(req.variables.CREATE_DIRECT_CHAT_NOTIFICATIONS_API_KEY) // Your secret API key
    ;

  try {
    const eventData = JSON.parse(req.variables.APPWRITE_FUNCTION_EVENT_DATA);
    const sender = eventData.sender;
    const sender_name = eventData.sender_name;
    const receiver = eventData.receiver;
    const messageId = eventData.$id;
    const channel = eventData.channel;

    await databases.createDocument(
      req.variables.DATABASE_ID,
      req.variables.DIRECT_CHAT_NOTIFICATIONS_COLLECTION_ID,
      sdk.ID.unique(),
      {
        sender,
        sender_name,
        isRead: false,
        messageId: messageId,
        readerId: receiver,
        channel
      },
      [
        sdk.Permission.read(sdk.Role.user(sender)),
        sdk.Permission.read(sdk.Role.user(receiver)),
        sdk.Permission.update(sdk.Role.user(receiver)),
      ]
    );

    res.json({
      success: true,
      message: 'created notification',
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.json({ success: false, error: error.message });
  }
};

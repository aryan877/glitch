import { NextApiRequest, NextApiResponse } from 'next';
import sdk from 'node-appwrite';

const postDirectChat = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = new sdk.Client();
  const clientWithKey = new sdk.Client();
  const account = new sdk.Account(client);
  const databases = new sdk.Databases(clientWithKey);

  const {
    jwt,
    content,
    channel,
    $id,
    reference,
    referenceContent,
    referenceUser,
    file,
    receiver,
  } = req.body;
  try {
    // Set up the Appwrite client
    client
      .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_ID as string) // Your project ID
      .setJWT(jwt); // Your secret JSON Web Token

    clientWithKey
      .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_ID as string) // Your project ID
      .setKey(process.env.POST_CHATS_COMMENTS_TASKS_API_KEY as string); // Your secret JSON Web Token

    // Verify authentication
    const user = await account.get();

    const response = await databases.createDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_DIRECT_CHATS_COLLECTION_ID as string,
      $id,
      {
        sender: user.$id,
        content,
        channel,
        receiver,
        ...(file && { file }),
        sender_name: user.name,
        ...(referenceContent &&
          reference && {
            reference: reference,
            referenceContent: referenceContent,
            referenceUser: referenceUser,
          }),
      },
      [
        sdk.Permission.read(sdk.Role.user(user.$id as string)),
        sdk.Permission.read(sdk.Role.user(receiver as string)),
        sdk.Permission.update(sdk.Role.user(user.$id as string)),
        sdk.Permission.delete(sdk.Role.user(user.$id as string)),
      ]
    );

    res.status(201).json({
      message: 'Document created successfully',
      document: response,
    });

    // Create the document in the chat collection
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
};

export default postDirectChat;

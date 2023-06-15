import { NextApiRequest, NextApiResponse } from 'next';
import sdk from 'node-appwrite';

const postDirectChat = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = new sdk.Client();
  const databases = new sdk.Databases(client);
  const { jwt, content, $id, sender_name } = req.body;
  try {
    // Set up the Appwrite client
    client
      .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_ID as string) // Your project ID
      .setJWT(jwt); // Your secret JSON Web Token
    const response = await databases.updateDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_DIRECT_CHATS_COLLECTION_ID as string,
      $id,
      {
        content,
        edited: true,
        sender_name: sender_name,
      }
    );
    res.status(201).json({
      message: 'Document updated successfully',
      document: response,
    });
    // Create the document in the chat collection
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
};

export default postDirectChat;

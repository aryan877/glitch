import { NextApiRequest, NextApiResponse } from 'next';
import sdk from 'node-appwrite';

const deleteChat = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = new sdk.Client();
  const databases = new sdk.Databases(client);
  const storage = new sdk.Storage(client);
  const { jwt, $id, file } = req.body;

  try {
    // Set up the Appwrite client
    client
      .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_ID as string) // Your project ID
      .setJWT(jwt); // Your secret JSON Web Token
    // Verify authentication
    try {
      const response = await databases.deleteDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID as string,
        process.env.NEXT_PUBLIC_CHATS_COLLECTION_ID as string,
        $id
      );
      if (file) {
        const promise = storage.deleteFile(
          process.env.NEXT_PUBLIC_CHATS_FILES_BUCKET_ID as string,
          file
        );
      }
      return res.status(201).json({
        message: 'Document deleted successfully',
        document: response,
      });
    } catch (error) {
      return res.status(403).json({
        error: 'You do not have permission to delete document',
      });
    }
    // Create the document in the chat collection
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
};

export default deleteChat;

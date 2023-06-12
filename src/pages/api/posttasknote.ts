import { NextApiRequest, NextApiResponse } from 'next';
import sdk from 'node-appwrite';

const postTaskComment = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = new sdk.Client();
  const clientWithKey = new sdk.Client();
  const account = new sdk.Account(client);
  const databases = new sdk.Databases(clientWithKey);
  const teams = new sdk.Teams(clientWithKey);
  const { content, team, taskId, jwt, file } = req.body;
  try {
    // Set up the Appwrite client
    client
      .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_ID as string) // Your project ID
      .setJWT(jwt); // Your secret JSON Web Token

    clientWithKey
      .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_ID as string) // Your project ID
      .setKey(process.env.POST_CHATS_COMMENTS_TASKS_API_KEY as string);

    // Verify authentication
    const user = await account.get();

    // Check if the user is a member of the team
    const membersList = await teams.listMemberships(team, [
      sdk.Query.equal('userId', user.$id),
    ]);

    if (membersList.total === 0) {
      return res
        .status(403)
        .json({ error: 'You are not a member of the team' });
    }
    const response = await databases.createDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_TASKS_NOTES_COLLECTION_ID as string,
      sdk.ID.unique(),
      {
        sender: user.$id,
        content,
        team,
        taskId,
        ...(file && { file }),
        sender_name: user.name,
      },
      [
        sdk.Permission.read(sdk.Role.team(team as string)),
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

export default postTaskComment;

import { NextApiRequest, NextApiResponse } from 'next';
import sdk from 'node-appwrite';

//endpoint for marking complete for the assignee only
const updateTaskCompletion = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const client = new sdk.Client();
  const clientWithKey = new sdk.Client();
  const databases = new sdk.Databases(clientWithKey);
  const account = new sdk.Account(client);
  const { taskId, jwt } = req.body;

  try {
    // Set up the Appwrite client
    client
      .setEndpoint('https://cloud.appwrite.io/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_ID as string)
      .setJWT(jwt as string);

    clientWithKey
      .setEndpoint('https://cloud.appwrite.io/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_ID as string)
      .setKey(process.env.PERMISSION_SETTING_API_KEY as string);

    // Get the existing task document
    const document = await databases.getDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_TASKS_COLLECTION_ID as string,
      taskId
    );

    // Verify authentication
    const user = await account.get();

    //@ts-ignore
    if (user.$id !== document.assignee) {
      return res.status(403).json({
        error:
          'You need are not the assignee of the task, only assignee can mark update task completion status',
      });
    }

    // Update the task document
    const response = await databases.updateDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_TASKS_COLLECTION_ID as string,
      taskId,
      //@ts-ignore
      { isComplete: !document.isCompleted }
    );

    res.status(200).json({
      message: 'Task completion updated successfully',
      document: response,
    });
  } catch (error) {
    console.error('Error updating task completion:', error);
    res.status(500).json({ error: 'Failed to update task completion' });
  }
};

export default updateTaskCompletion;

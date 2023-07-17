import { NextApiRequest, NextApiResponse } from 'next';
import sdk from 'node-appwrite';

const pinTask = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = new sdk.Client();
  const clientWithKey = new sdk.Client();
  const account = new sdk.Account(client);
  const databases = new sdk.Databases(clientWithKey);
  const teams = new sdk.Teams(clientWithKey);
  const { jwt, team, taskId } = req.body;
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

    const membersList = await teams.listMemberships(team, [
      sdk.Query.equal('userId', user.$id),
    ]);

    if (membersList.total === 0) {
      return res
        .status(403)
        .json({ error: 'You are not a member of the team' });
    }

    const response = await databases.getDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_TASKS_COLLECTION_ID as string,
      taskId
    );

    //@ts-ignore
    const isPinned = response.pinned.includes(user.$id);

    if (isPinned) {
      //@ts-ignore
      response.pinned = response.pinned.filter((id: string) => id !== user.$id);
    } else {
      //@ts-ignore
      response.pinned.push(user.$id);
    }

    const updatedResponse = await databases.updateDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_TASKS_COLLECTION_ID as string,
      taskId,
      //@ts-ignore
      { pinned: response.pinned }
    );

    const pinnedCheck = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_TASKS_PINNED_COLLECTION_ID as string,
      [sdk.Query.equal('userId', user.$id), sdk.Query.equal('team', team)]
    );

    if (pinnedCheck.total === 0) {
      const pinnedDocumentCreationResponse = await databases.createDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID as string,
        process.env.NEXT_PUBLIC_TASKS_PINNED_COLLECTION_ID as string,
        sdk.ID.unique(),
        { team, userId: user.$id, tasks: [taskId] },
        [sdk.Permission.read(sdk.Role.user(user.$id as string))]
      );
      return res.status(201).json({
        message: 'Document updated successfully',
        document: pinnedDocumentCreationResponse,
      });
    } else {
      const validDocument = pinnedCheck.documents[0];

      //@ts-ignore
      const isTaskExist = validDocument.tasks.includes(taskId);

      if (isTaskExist) {
        //@ts-ignore
        validDocument.tasks = validDocument.tasks.filter(
          (id: string) => id !== taskId
        );
      } else {
        //@ts-ignore
        validDocument.tasks.push(taskId);
      }

      const updatedPinnedDocument = await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID as string,
        process.env.NEXT_PUBLIC_TASKS_PINNED_COLLECTION_ID as string,
        validDocument.$id,
        //@ts-ignore
        { tasks: validDocument.tasks }
      );

      res.status(201).json({
        message: 'Document updated successfully',
        document: updatedResponse,
        pinnedDocument: updatedPinnedDocument,
      });
    }
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
};

export default pinTask;

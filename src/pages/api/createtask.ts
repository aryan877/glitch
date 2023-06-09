import { NextApiRequest, NextApiResponse } from 'next';
import sdk from 'node-appwrite';

const createTask = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = new sdk.Client();
  const clientWithKey = new sdk.Client();
  const account = new sdk.Account(client);
  const databases = new sdk.Databases(clientWithKey);
  const teams = new sdk.Teams(client);
  const { jwt, team, taskName, taskDescription, assignee, taskPriority } =
    req.body;
  try {
    // Set up the Appwrite client
    client
      .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_ID as string) // Your project ID
      .setJWT(jwt); // Your secret JSON Web Token

    clientWithKey
      .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_ID as string) // Your project ID
      .setKey(process.env.PERMISSION_SETTING_API_KEY as string);

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

    const isOwnerOrAdmin = membersList.memberships.some((membership) => {
      return (
        membership?.userId === user.$id &&
        (membership.roles.includes('owner') ||
          membership.roles.includes('admin'))
      );
    });

    if (!isOwnerOrAdmin) {
      return res.status(403).json({
        error: 'You need owner or admin role in order to create tasks',
      });
    }

    const response = await databases.createDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_TASKS_COLLECTION_ID as string,
      sdk.ID.unique(),
      {
        taskName,
        taskDescription,
        assignee,
        team,
        priority: taskPriority,
        action: 'CREATE',
        isComplete: false,
      },
      [
        sdk.Permission.read(sdk.Role.team(team as string)),
        sdk.Permission.update(sdk.Role.team(team as string, 'owner')),
        sdk.Permission.update(sdk.Role.team(team as string, 'admin')),
        sdk.Permission.delete(sdk.Role.team(team as string, 'owner')),
        sdk.Permission.delete(sdk.Role.team(team as string, 'admin')),
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

export default createTask;

import { NextApiRequest, NextApiResponse } from 'next';
import sdk from 'node-appwrite';

const addToTeam = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = new sdk.Client();
  const clientWithKey = new sdk.Client();
  const account = new sdk.Account(client);
  const databases = new sdk.Databases(clientWithKey);
  const teams = new sdk.Teams(clientWithKey);
  const { jwt, team, userEmail } = req.body;
  try {
    // Set up the Appwrite client
    client
      .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_ID as string) // Your project ID
      .setJWT(jwt); // Your secret JSON Web Token

    clientWithKey
      .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_ID as string) // Your project ID
      .setKey(process.env.ADD_TO_TEAM_API_KEY as string);

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

    const isOwner = membersList.memberships.some((membership) => {
      return (
        membership?.userId === user.$id && membership.roles.includes('owner')
      );
    });

    if (!isOwner) {
      return res.status(403).json({
        error: 'You need owner role in order to add to team',
      });
    }

    const teamPrefs = await databases.getDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_TEAMS_COLLECTION_ID as string,
      team
    );

    //@ts-ignore
    const role: string = teamPrefs?.defaultRole || 'member';

    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://glitch.zone'
        : 'http://localhost:3000';

    const response = await teams.createMembership(
      team,
      [role],
      baseUrl,
      userEmail
    );

    res.status(201).json({
      message: 'membership created successfully',
      document: response,
    });

    // Create the document in the chat collection
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
};

export default addToTeam;

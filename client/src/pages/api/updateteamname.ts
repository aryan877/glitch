import { NextApiRequest, NextApiResponse } from 'next';
import sdk from 'node-appwrite';

const updateTeamName = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = new sdk.Client();
  const clientWithKey = new sdk.Client();
  const account = new sdk.Account(client);
  const teams = new sdk.Teams(clientWithKey);
  const { jwt, team, name } = req.body;
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

    await teams.updateName(team, name);

    res.status(201).json({
      message: 'named updated successfully',
    });
    // Create the document in the chat collection
  } catch (error) {
    res.status(500).json({ error: 'Failed to update team name' });
  }
};

export default updateTeamName;

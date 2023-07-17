import { NextApiRequest, NextApiResponse } from 'next';
import sdk from 'node-appwrite';

const getUser = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = new sdk.Client();
  const users = new sdk.Users(client);

  try {
    // Set up the Appwrite client
    client
      .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_ID as string) // Your project ID
      .setKey(process.env.GET_USER_API_KEY as string); // Your Appwrite API key

    const { userId } = req.body; // Retrieve the user ID from the request body

    // Fetch the user using the Appwrite SDK
    const response = await users.get(userId);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export default getUser;

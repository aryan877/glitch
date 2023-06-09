import { NextApiRequest, NextApiResponse } from 'next';
import sdk from 'node-appwrite';

const getUsers = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = new sdk.Client();
  const users = new sdk.Users(client);

  try {
    // Set up the Appwrite client
    client
      .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_ID as string)
      .setKey(process.env.GET_USER_API_KEY as string);

    const { search } = req.body; // Retrieve the search term from the request body

    // Fetch the list of users using the Appwrite SDK
    const response = await users.list(undefined, search);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export default getUsers;

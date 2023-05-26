import { Text } from '@chakra-ui/react';
import React from 'react';
import Layout from '../../components/Layout';
import withAuth from '../../utils/withAuth';

function settings() {
  return (
    <Layout>
      <Text mx={8} fontWeight="bold" fontSize="xl">
        Settings
      </Text>
    </Layout>
  );
}

export default withAuth(settings);

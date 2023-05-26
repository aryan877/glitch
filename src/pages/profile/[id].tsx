import { Image } from '@chakra-ui/next-js';
import { Box, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import tinycolor from 'tinycolor2';
import Layout from '../../../components/Layout';
import withAuth from '../../../utils/withAuth';

function Profile() {
  return (
    <Layout>
      <Box mx={8}>
        <Box display="flex" alignItems="center" mb={8}>
          <Image
            bgGradient={`linear-gradient(to bottom right, gray.700 0%, ${tinycolor(
              'gray.700'
            )
              .complement()
              .lighten(20)
              .toString()} 100%)`}
            src="/bg.png"
            width="240"
            boxShadow="xl"
            borderRadius="full"
            height="240"
            alt="team profile"
            mr={8}
          />
          <VStack spacing={4} align="start">
            <Text fontWeight="extrabold" fontSize="6xl">
              Aryan Kumar
            </Text>
            <Text fontWeight="semibold" fontSize="lg">
              aryankumar877@gmail.com
            </Text>
            <Text fontWeight="semibold" fontSize="lg">
              2 Teams
            </Text>
          </VStack>
        </Box>
        {/* Add other details here */}
      </Box>
    </Layout>
  );
}

export default withAuth(Profile);

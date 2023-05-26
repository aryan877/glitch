import { useRouter } from 'next/router';
import React, { useContext, useEffect } from 'react';
import Loader from '../components/Loader';
import { UserContext, useUser } from '../context/UserContext';
const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WrapperComponent: React.FC<P> = (props) => {
    const { currentUser, loading } = useUser(); // Access the currentUser from UserContext
    const router = useRouter();

    useEffect(() => {
      if (loading || currentUser === null) {
        return;
      }
      // Check if user is not authenticated, redirect to login page
      if (currentUser === undefined) {
        router.push('/login');
      }
    }, [currentUser, router, loading]);

    // Render the wrapped component if user is authenticated
    return (
      <>
        {loading && <Loader />}
        {loading === false && currentUser && <WrappedComponent {...props} />}
      </>
    );
  };

  return WrapperComponent;
};

export default withAuth;

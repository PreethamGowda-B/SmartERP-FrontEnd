import React from 'react';
import { GetServerSideProps } from 'next';
import { getUserFromServer } from '../lib/ssrAuth';

export default function ProfilePage({ user }: any) {
  return (
    <div style={{ maxWidth:800, margin:'24px auto' }}>
      <h2>Profile</h2>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookie = context.req.headers.cookie;
  const user = await getUserFromServer(cookie as string | undefined);
  if (!user) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  return { props: { user } };
};

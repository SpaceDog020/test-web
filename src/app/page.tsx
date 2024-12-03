import { redirect } from 'next/navigation';

const Home = () => {
  redirect('/auth/login');
  return null; // Esta página no se renderizará
};

export default Home;
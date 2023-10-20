import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SigninPage from './pages/signin/Signin';
import SignupPage from './pages/signup/Signup';
import MainPage from './pages/main/Main';
import IntroPage from './pages/intro/Intro';
import NetworkPage from './pages/network/Network';
import UserIdPage from './pages/userId/UserId';
import MyPage from './pages/my/My';
import UsersPage from './pages/users/Users';
import Header from './components/layout/Layout.Header';
import Footer from './components/layout/Layout.Footer';
import ErrorPage from './pages/ErrorPage';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Header />}>
        <Route path="/" element={<MainPage />} />
        <Route path="network" element={<NetworkPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="user/:id" element={<UserIdPage />} />
        <Route path="mypage" element={<MyPage />} />
        <Route element={<Footer />}>
          <Route path="intro" element={<IntroPage />} />
          <Route path="signin" element={<SigninPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="*" element={<ErrorPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">© {new Date().getFullYear()} CloudCart</div>
    </footer>
  );
}

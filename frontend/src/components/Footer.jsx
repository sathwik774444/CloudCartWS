import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-content">
          <div className="footer-section">
            <h4>CloudCart</h4>
            <p>Your trusted e-commerce platform for quality products and exceptional service.</p>
          </div>
          
          <div className="footer-section">
            <h5>Quick Links</h5>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/help">Help & Support</Link></li>
              <li><Link to="/orders">Track Order</Link></li>
              <li><Link to="/profile">My Account</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h5>Customer Service</h5>
            <ul>
              <li><Link to="/help">Contact Us</Link></li>
              <li><Link to="/help">Shipping Info</Link></li>
              <li><Link to="/help">Returns</Link></li>
              <li><Link to="/help">FAQ</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h5>Connect</h5>
            <ul>
              <li>Email: support@cloudcart.com</li>
              <li>Phone: 1-800-CLOUDCART</li>
              <li>Hours: Mon-Fri 9AM-6PM EST</li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} CloudCart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

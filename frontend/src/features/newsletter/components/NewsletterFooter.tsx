import '../../../styles/features/newsletter/NewsletterFooter.css';

export const NewsletterFooter = () => {
  return (
    <footer className="newsletter-footer">
      <div className="newsletter-footer-content">
        <div className="footer-section">
          <h3>About the Partnership</h3>
          <p>MongoDB and PeerAI collaborate to deliver innovative data solutions that transform businesses.</p>
        </div>
        
        <div className="footer-section">
          <h3>Connect With Us</h3>
          <div className="footer-links">
            <a href="/accelerators">Accelerators</a>
            <a href="/success-stories">Success Stories</a>
            <a href="/insights">Insights</a>
            <a href="/contact">Contact</a>
          </div>
        </div>
        
        <div className="footer-section">
          <h3>Stay Updated</h3>
          <div className="newsletter-signup">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="newsletter-email-input"
            />
            <button className="newsletter-subscribe-btn">Subscribe</button>
          </div>
        </div>
      </div>
      
      <div className="newsletter-footer-bottom">
        <p>&copy; {new Date().getFullYear()} MongoDB & PeerAI. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default NewsletterFooter;

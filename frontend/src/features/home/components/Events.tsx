import '@/styles/features/home/Events.css';
import arrowIcon from '@/assets/upcoming events/Vector.svg';
import eventBgImage from '@/assets/upcoming events/c433d9853fc3a6673235cea6507f3cb820675fc2.png';
import eventImage from '@/assets/upcoming events/a1bb4511f52b9556276916a53c44797104e634c0.png';
import svgIcon1 from '@/assets/upcoming events/svg470935930_2091.svg';
import svgIcon2 from '@/assets/upcoming events/svg507675772_2203.svg';
import svgIcon3 from '@/assets/upcoming events/svg260955957_294.svg';
import svgIcon4 from '@/assets/upcoming events/svg1239545273_400.svg';
import svgIcon5 from '@/assets/upcoming events/svg-764842412_403.svg';

const Events = () => {
  return (
    <section className="events">
      <div className="events-container">
        <div className="event-card">
          {/* Background image with mix-blend-mode - matches Figma node 17:1536 exactly */}
          <div className="event-bg-wrapper">
            <img 
              src={eventBgImage} 
              alt="" 
              className="event-bg-image" 
            />
          </div>
          
          {/* Content on left - matches Figma node 17:1537 exactly */}
          <div className="event-content">
            <div className="event-content-wrapper">
            <h2 className="event-title">Upcoming Events</h2>
            <div className="event-spacer"></div>
            <div className="event-details">
              <h3 className="event-name">Accelerating Cassandra to MongoDB Migrations</h3>
              <p className="event-date">January 24, 2026 • 11:00 AM EST</p>
              </div>
            </div>
            <button className="event-register-btn">
              <span>Register Now</span>
              <img src={arrowIcon} alt="" className="event-arrow" />
            </button>
          </div>
          
          {/* Image on right */}
          <div className="event-image-container">
            <img 
              src={eventImage} 
              alt="" 
              className="event-image" 
            />
          </div>
          
          {/* Browser icons overlay */}
          <div className="event-icons">
            <div className="event-icon event-icon-1">
              <img src={svgIcon1} alt="" />
            </div>
            <div className="event-icon event-icon-2">
              <img src={svgIcon2} alt="" />
            </div>
            <div className="event-icon event-icon-3">
              <img src={svgIcon3} alt="" />
            </div>
            <div className="event-icon event-icon-4">
              <img src={svgIcon4} alt="" />
            </div>
            <div className="event-icon event-icon-5">
              <img src={svgIcon5} alt="" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Events;



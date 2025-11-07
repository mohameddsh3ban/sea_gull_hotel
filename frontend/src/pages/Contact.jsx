import React from 'react';

const Contact = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white mt-10 rounded-xl shadow">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Contact Us</h1>
      <p className="text-gray-600 mb-4">
        If you have any questions, inquiries, or need assistance during your stay, feel free to reach out to us.
      </p>
      <ul className="text-gray-600 space-y-2">
        <li><strong>Email:</strong> info@hurghadaseagull.com</li>
        <li><strong>Phone:</strong> +20 65 344 9600</li>
        <li><strong>Instagram:</strong> @seagullbeachresorthrg</li>
      </ul>
    </div>
  );
};

export default Contact;

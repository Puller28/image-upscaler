import React from 'react';
import { HelpCircle } from 'lucide-react';

export const FAQ: React.FC = () => {
  const faqs = [
    {
      question: "What is image upscaling?",
      answer: "Image upscaling is the process of increasing an image's resolution while maintaining quality. Our tool uses advanced algorithms to enlarge your images for printing without losing clarity."
    },
    {
      question: "What print sizes are available?",
      answer: "We offer multiple standard print sizes: 24\" × 36\" (poster), 24\" × 32\", 24\" × 30\", 11\" × 14\" (photo), and A1 ISO format. You can select multiple sizes and process them all at once."
    },
    {
      question: "What's the maximum file size I can upload?",
      answer: "You can upload images up to 25MB in size. We support JPG, PNG, and WebP formats for optimal quality."
    },
    {
      question: "What resolution should my original image be?",
      answer: "For best results, your original image should be at least 1000px on the shortest side. Higher resolution originals will produce better quality enlargements."
    },
    {
      question: "Is this tool suitable for Etsy sellers?",
      answer: "Yes! Our tool is perfect for Etsy sellers who create digital art and printables. You can quickly convert your artwork into multiple print-ready sizes at 300 DPI, which is essential for professional printing. This makes it easy to offer various size options in your Etsy shop without maintaining multiple versions of each artwork."
    },
    {
      question: "How do I prepare images for selling prints?",
      answer: "For digital art and printables, we automatically process your images at 300 DPI (dots per inch) - the professional standard for high-quality printing. This ensures your customers can print your artwork at any size without loss of quality, perfect for both home printing and professional print shops."
    },
    {
      question: "How do I download my upscaled images?",
      answer: "You can download individual images using the Download button next to each processed size, or use the 'Download All' button to get a ZIP file containing all your upscaled images."
    },
    {
      question: "What DPI are the output images?",
      answer: "All images are processed at 300 DPI (dots per inch), which is the professional standard for high-quality printing."
    },
    {
      question: "Is this service free?",
      answer: "Yes, our image upscaling service is completely free to use, with no watermarks or limitations on the number of images you can process."
    },
    {
      question: "How long does processing take?",
      answer: "Processing time varies based on the original image size and how many output sizes you've selected. Most images are processed within 1-2 minutes per size."
    }
  ];

  return (
    <section className="max-w-4xl mx-auto mt-16 px-4" aria-labelledby="faq-heading">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <HelpCircle className="w-6 h-6 text-indigo-600" />
          <h2 id="faq-heading" className="text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
        </div>
        <p className="text-lg text-gray-600">
          Everything you need to know about our image upscaling service
        </p>
      </div>

      <div className="grid gap-6">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {faq.question}
            </h3>
            <p className="text-gray-600">{faq.answer}</p>
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-gray-500">
          Still have questions?{' '}
          <a
            href="mailto:support@imageupscaler.app"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Contact our support team
          </a>
        </p>
      </div>
    </section>
  );
};
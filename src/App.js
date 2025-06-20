import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Image as ImageIcon, Sparkles, Download, RotateCcw } from 'lucide-react'; // Using Sparkles icon

// Main App Component
const App = () => {
  const [originalImageFile, setOriginalImageFile] = useState(null); // Stores the actual File object
  const [originalImageUrl, setOriginalImageUrl] = useState(null); // Stores the URL for displaying the original image
  const [cartoonImage, setCartoonImage] = useState(null); // Stores the URL for displaying the cartoonized image
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('whitebox'); // Default style

  // Available cartoonization styles from your backend (based on cartoonizer.py)
  const availableStyles = [
    { value: 'whitebox', label: 'Whitebox' },
    { value: 'sketch', label: 'Sketch' },
    { value: 'oilpaint', label: 'Oil Paint' },
  ];

  // Effect to clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
      if (cartoonImage) URL.revokeObjectURL(cartoonImage);
    };
  }, [originalImageUrl, cartoonImage]);

  // Function to handle the actual cartoonization request to the backend
  const handleCartoonize = async () => {
    if (!originalImageFile) {
      setError('Please upload an image first.');
      return;
    }

    setCartoonImage(null); // Clear previous cartoonized image
    setError(null);       // Clear any previous errors
    setIsLoading(true);   // Start loading indicator

    const formData = new FormData();
    formData.append('file', originalImageFile); // Use the stored File object
    formData.append('style', selectedStyle); // Append the selected style

    try {
      const backendUrl = 'http://127.0.0.1:8000/cartoonize/'; 
      const response = await fetch(backendUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Server responded with ${response.status} ${response.statusText}.`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage += ` Detail: ${errorData.detail}`;
          }
        } catch (jsonError) {
          console.error("Error parsing backend error response:", jsonError);
        }
        throw new Error(errorMessage);
      }
      
      const imageBlob = await response.blob();
      setCartoonImage(URL.createObjectURL(imageBlob)); // Set the cartoonized image URL

    } catch (err) {
      console.error("Error cartoonizing image:", err);
      setError(`Failed to cartoonize image. Please ensure the backend server is running and accessible. ${err.message}`);
    } finally {
      setIsLoading(false); // End loading indicator
    }
  };

  // Callback for react-dropzone when files are dropped or selected
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith('image/')) {
        // Clean up previous original image URL if exists
        if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
        
        setOriginalImageFile(file); // Store the file object
        setOriginalImageUrl(URL.createObjectURL(file)); // Create URL for display
        setCartoonImage(null); // Reset cartoonized image
        setError(null);        // Clear errors
        setIsLoading(false);   // Ensure loading is false
    } else {
        setError('Please upload a valid image file (PNG, JPG, etc.).');
    }
  }, [originalImageUrl]); // Dependency for revoking old URL

  // Initialize dropzone hook
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    multiple: false,
  });

  // Function to reset the application to its initial state
  const resetState = () => {
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (cartoonImage) URL.revokeObjectURL(cartoonImage);

    setOriginalImageFile(null);
    setOriginalImageUrl(null);
    setCartoonImage(null);
    setIsLoading(false);
    setError(null);
    setSelectedStyle('whitebox'); // Reset style to default
  };

  // Helper function to render the content inside the cartoonized image box
  const renderCartoonizedContent = () => {
    if (isLoading) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-800/50 backdrop-blur-sm z-10 rounded-lg">
          <div className="loader ease-linear rounded-full border-4 border-t-4 border-blue-400 h-12 w-12 mb-4"></div>
          <p className="text-lg font-medium text-blue-100">Cartoonizing...</p>
          <p className="text-sm text-blue-200">Applying "{selectedStyle}" style...</p>
        </div>
      );
    }
    if (cartoonImage) {
      return <img src={cartoonImage} alt="Cartoonized" className="w-full h-full object-cover rounded-lg" />;
    }
    // Default placeholder for the cartoonized image area
    return (
      <div className="flex flex-col items-center text-zinc-500">
        <ImageIcon className="h-16 w-16 text-zinc-400" />
        <p>Result will appear here</p>
      </div>
    );
  };

  return (
    <div className="bg-zinc-900 text-white min-h-screen font-sans antialiased">
      {/* Main container with responsive padding */}
      <div className="container mx-auto px-4 py-8">
        
        {/* Header Section */}
        <header className="flex justify-between items-center pb-8 border-b border-zinc-700 mb-8">
          <div className="flex items-center space-x-3">
            <Sparkles className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold tracking-tighter">AI-Cartoonizer</h1>
          </div>
        </header>

        <main>
          {/* Initial Call to Action / Welcome Section (shown only when no image is uploaded) */}
          {!originalImageUrl && (
            <div className="text-center py-16 md:py-24">
              <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-500 text-transparent bg-clip-text">
                Transform Your Photos into Masterpieces.
              </h2>
              <p className="mt-4 text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
                Upload a photo, choose a style, and let our AI create stunning art.
              </p>
            </div>
          )}

          {/* Image Upload Dropzone (shown when no image is uploaded) */}
          {!originalImageUrl && (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm">
                <div {...getRootProps()} className={`relative border-2 border-dashed border-zinc-600 rounded-xl p-12 text-center cursor-pointer transition-all duration-300 hover:border-blue-400 hover:bg-zinc-800/60 ${isDragActive ? 'border-blue-500 bg-zinc-800' : ''}`}>
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center">
                      <UploadCloud className="h-8 w-8 text-zinc-400" />
                    </div>
                    <p className="text-lg font-semibold text-zinc-300">
                      {isDragActive ? "Drop the image here..." : "Drag & drop an image here, or click to select"}
                    </p>
                    <p className="text-sm text-zinc-500">Supports: JPG, JPEG, PNG</p>
                  </div>
                </div>
            </div>
          )}

          {/* Main Processing Area (shown after image upload) */}
          {originalImageUrl && (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  {/* Original Image Preview Section */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-center text-zinc-300">Original</h3>
                    <div className="aspect-w-4 aspect-h-3 bg-zinc-700 rounded-lg overflow-hidden flex items-center justify-center">
                      <img src={originalImageUrl} alt="Original" className="w-full h-full object-contain rounded-lg" />
                    </div>
                  </div>

                  {/* Cartoonized Image Result Section */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-center text-zinc-300">Cartoonized</h3>
                    <div className="aspect-w-4 aspect-h-3 bg-zinc-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                      {renderCartoonizedContent()}
                    </div>
                  </div>
                </div>

                {/* Style Selection and Generate Button (shown if an image is uploaded and not currently loading results) */}
                {!isLoading && !cartoonImage && (
                    <div className="mt-8 flex flex-col items-center">
                        <div className="w-full max-w-md">
                            <label htmlFor="style-select" className="block text-zinc-300 text-sm font-medium mb-2 text-center">
                                Choose a Cartoonization Style:
                            </label>
                            <div className="relative mb-6">
                                <select
                                    id="style-select"
                                    value={selectedStyle}
                                    onChange={(e) => setSelectedStyle(e.target.value)}
                                    className="block w-full px-4 py-2 pr-8 bg-zinc-700 border border-zinc-600 rounded-lg shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                                >
                                    {availableStyles.map((style) => (
                                    <option key={style.value} value={style.value}>
                                        {style.label}
                                    </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleCartoonize}
                            disabled={isLoading}
                            className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-extrabold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xl"
                        >
                            <Sparkles className="h-6 w-6 mr-3" />
                            Generate Cartoon
                        </button>
                    </div>
                )}
            </div>
          )}
            
          {/* Error Message Display */}
          {error && <p className="text-red-400 text-center mt-4 text-lg font-medium">{error}</p>}
          
          {/* Action Buttons (Try Another, Download) - Shown only when an image has been cartoonized */}
          {(originalImageUrl && cartoonImage) && (
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
              {/* Button to reset and try another image */}
              <button
                onClick={resetState}
                className="flex items-center justify-center px-6 py-3 bg-zinc-600 hover:bg-zinc-500 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                disabled={isLoading}
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Try Another
              </button>
              {/* Button to download the cartoonized image */}
              <button
                onClick={() => {
                  if (cartoonImage) {
                    const link = document.createElement('a');
                    link.href = cartoonImage;
                    link.download = `ai-cartoonizer-${selectedStyle}-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                disabled={!cartoonImage || isLoading}
                className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                <Download className="h-5 w-5 mr-2" />
                Download
              </button>
            </div>
          )}

        </main>
        
        {/* Footer Section */}
        <footer className="text-center text-zinc-500 pt-16 pb-4 border-t border-zinc-800 mt-8">
          <p>&copy; {new Date().getFullYear()} AI-Cartoonizer. All Rights Reserved.</p>
        </footer>
      </div>

      {/* Custom CSS for loader animation and aspect ratio helper classes */}
      <style>{`
        /* Loader spinner animation */
        .loader {
          border-top-color: #3b82f6; /* Tailwind blue-500 equivalent */
          animation: spinner 1.5s linear infinite;
        }
        @keyframes spinner {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Aspect Ratio utility classes for responsive image containers */
        .aspect-w-4 {
          position: relative;
          padding-bottom: 75%; /* (3 / 4) * 100% */
        }
        .aspect-w-4 > * {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            object-fit: cover;
        }
        .aspect-w-4 .object-contain {
          object-fit: contain;
        }

        /* Custom scrollbar for better aesthetics */
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #27272a; /* zinc-800 */
        }
        ::-webkit-scrollbar-thumb {
            background: #52525b; /* zinc-600 */
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #3b82f6; /* blue-500 */
        }
      `}</style>
    </div>
  );
};

export default App;


// import React, { useState, useCallback, useEffect } from 'react';
// import { useDropzone } from 'react-dropzone';
// import { UploadCloud, Image as ImageIcon, Sparkles, Download, RotateCcw } from 'lucide-react'; // Changed Wind to Sparkles for theme

// // Main App Component
// const App = () => {
//   const [originalImage, setOriginalImage] = useState(null);
//   const [cartoonImage, setCartoonImage] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [selectedStyle, setSelectedStyle] = useState('whitebox'); // Default style

//   // Available cartoonization styles from your backend (based on cartoonizer.py)
//   const availableStyles = [
//     { value: 'whitebox', label: 'Whitebox' },
//     { value: 'sketch', label: 'Sketch' },
//     { value: 'oilpaint', label: 'Oil Paint' },
//   ];

//   // Effect to clean up object URLs to prevent memory leaks when component unmounts or images change
//   useEffect(() => {
//     return () => {
//       if (originalImage) URL.revokeObjectURL(originalImage);
//       if (cartoonImage) URL.revokeObjectURL(cartoonImage);
//     };
//   }, [originalImage, cartoonImage]);

//   // Function to handle image upload and API call to the backend
//   const handleImageUpload = async (file) => {
//     if (!file) return;

//     // Clean up previous image URLs before setting new ones
//     if (originalImage) URL.revokeObjectURL(originalImage);
//     if (cartoonImage) URL.revokeObjectURL(cartoonImage);

//     setOriginalImage(URL.createObjectURL(file));
//     setCartoonImage(null); // Clear previous cartoonized image
//     setError(null);       // Clear any previous errors
//     setIsLoading(true);   // Start loading indicator

//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('style', selectedStyle); // Append the selected style

//     try {
//       // Ensure this URL matches your backend's cartoonize endpoint
//       // Based on your main.py, it's /cartoonize/
//       const backendUrl = 'http://127.0.0.1:8000/cartoonize/'; 
//       const response = await fetch(backendUrl, {
//         method: 'POST',
//         body: formData,
//       });

//       if (!response.ok) {
//         // Parse the error message from the backend if available
//         let errorMessage = `Server responded with ${response.status} ${response.statusText}.`;
//         try {
//           const errorData = await response.json();
//           if (errorData.detail) {
//             errorMessage += ` Detail: ${errorData.detail}`;
//           }
//         } catch (jsonError) {
//           // If response is not JSON, use default error message
//           console.error("Error parsing backend error response:", jsonError);
//         }
//         throw new Error(errorMessage);
//       }
      
//       const imageBlob = await response.blob();
//       setCartoonImage(URL.createObjectURL(imageBlob)); // Set the cartoonized image URL

//     } catch (err) {
//       console.error("Error uploading image:", err);
//       setError(`Failed to cartoonify image. Please ensure the backend server is running and accessible. ${err.message}`);
//     } finally {
//       setIsLoading(false); // End loading indicator
//     }
//   };

//   // Callback for react-dropzone when files are dropped or selected
//   const onDrop = useCallback((acceptedFiles) => {
//     const file = acceptedFiles[0];
//     if (file && file.type.startsWith('image/')) {
//         handleImageUpload(file);
//     } else {
//         setError('Please upload a valid image file (PNG, JPG, etc.).');
//     }
//   }, [selectedStyle, originalImage, cartoonImage]); // Include selectedStyle and image states in dependencies

//   // Initialize dropzone hook
//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
//     multiple: false,
//   });

//   // Function to reset the application to its initial state
//   const resetState = () => {
//     // Revoke object URLs to free up memory when resetting
//     if (originalImage) URL.revokeObjectURL(originalImage);
//     if (cartoonImage) URL.revokeObjectURL(cartoonImage);

//     setOriginalImage(null);
//     setCartoonImage(null);
//     setIsLoading(false);
//     setError(null);
//     setSelectedStyle('whitebox'); // Reset style to default
//   };

//   // Helper function to render the content inside the cartoonized image box
//   const renderCartoonizedContent = () => {
//     if (isLoading) {
//       return (
//         <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-800/50 backdrop-blur-sm z-10 rounded-lg">
//           <div className="loader ease-linear rounded-full border-4 border-t-4 border-blue-400 h-12 w-12 mb-4"></div>
//           <p className="text-lg font-medium text-blue-100">Cartoonizing...</p>
//           <p className="text-sm text-blue-200">Applying "{selectedStyle}" style...</p>
//         </div>
//       );
//     }
//     if (cartoonImage) {
//       return <img src={cartoonImage} alt="Cartoonized" className="w-full h-full object-cover rounded-lg" />;
//     }
//     // Default placeholder for the cartoonized image area
//     return (
//       <div className="flex flex-col items-center text-zinc-500">
//         <ImageIcon className="h-16 w-16 text-zinc-400" />
//         <p>Result will appear here</p>
//       </div>
//     );
//   };

//   return (
//     <div className="bg-zinc-900 text-white min-h-screen font-sans antialiased">
//       {/* Main container with responsive padding */}
//       <div className="container mx-auto px-4 py-8">
        
//         {/* Header Section */}
//         <header className="flex justify-between items-center pb-8 border-b border-zinc-700 mb-8">
//           <div className="flex items-center space-x-3">
//             <Sparkles className="h-8 w-8 text-blue-400" /> {/* Updated icon color */}
//             <h1 className="text-3xl font-bold tracking-tighter">AI-Cartoonizer</h1> {/* New website name */}
//           </div>
//         </header>

//         <main>
//           {/* Initial Call to Action / Welcome Section */}
//           {!originalImage && (
//             <div className="text-center py-16 md:py-24">
//               <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-500 text-transparent bg-clip-text"> {/* New gradient */}
//                 Transform Your Photos into Masterpieces. {/* New slogan */}
//               </h2>
//               <p className="mt-4 text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
//                 Upload a photo and let our AI transform it using various artistic styles.
//               </p>
//             </div>
//           )}

//           {/* Image Upload Dropzone & Style Selection */}
//           <div className={`bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm ${!originalImage ? 'block' : 'hidden'}`}>
//               <div {...getRootProps()} className={`relative border-2 border-dashed border-zinc-600 rounded-xl p-12 text-center cursor-pointer transition-all duration-300 hover:border-blue-400 hover:bg-zinc-800/60 ${isDragActive ? 'border-blue-500 bg-zinc-800' : ''}`}>
//                 <input {...getInputProps()} />
//                 <div className="flex flex-col items-center justify-center space-y-4">
//                   <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center">
//                     <UploadCloud className="h-8 w-8 text-zinc-400" />
//                   </div>
//                   <p className="text-lg font-semibold text-zinc-300">
//                     {isDragActive ? "Drop the image here..." : "Drag & drop an image here, or click to select"}
//                   </p>
//                   <p className="text-sm text-zinc-500">Supports: JPG, JPEG, PNG</p>
//                 </div>
//               </div>
              
//               {/* Style Selection Dropdown */}
//               <div className="mt-6">
//                 <label htmlFor="style-select" className="block text-zinc-300 text-sm font-medium mb-2">
//                   Choose a Cartoonization Style:
//                 </label>
//                 <div className="relative">
//                   <select
//                     id="style-select"
//                     value={selectedStyle}
//                     onChange={(e) => setSelectedStyle(e.target.value)}
//                     className="block w-full px-4 py-2 pr-8 bg-zinc-700 border border-zinc-600 rounded-lg shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
//                     disabled={isLoading || originalImage} // Disable if loading or image is already uploaded
//                   >
//                     {availableStyles.map((style) => (
//                       <option key={style.value} value={style.value}>
//                         {style.label}
//                       </option>
//                     ))}
//                   </select>
//                   <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
//                     <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
//                       <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
//                     </svg>
//                   </div>
//                 </div>
//               </div>
//           </div>

//           {/* Display Area for Original and Cartoonized Images */}
//           {originalImage && (
//             <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
//                   {/* Original Image Section */}
//                   <div className="space-y-4">
//                     <h3 className="text-xl font-semibold text-center text-zinc-300">Original</h3>
//                     <div className="aspect-w-4 aspect-h-3 bg-zinc-700 rounded-lg overflow-hidden flex items-center justify-center">
//                       <img src={originalImage} alt="Original" className="w-full h-full object-contain rounded-lg" />
//                     </div>
//                   </div>

//                   {/* Cartoonized Image Section */}
//                   <div className="space-y-4">
//                     <h3 className="text-xl font-semibold text-center text-zinc-300">Cartoonized</h3>
//                     <div className="aspect-w-4 aspect-h-3 bg-zinc-700 rounded-lg flex items-center justify-center relative overflow-hidden">
//                       {renderCartoonizedContent()}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//           )}
            
//           {/* Error Message Display */}
//           {error && <p className="text-red-400 text-center mt-4 text-lg font-medium">{error}</p>}
          
//           {/* Action Buttons (Try Another, Download) */}
//           {(originalImage) && (
//             <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
//               {/* Button to reset and try another image */}
//               <button
//                 onClick={resetState}
//                 className="flex items-center justify-center px-6 py-3 bg-zinc-600 hover:bg-zinc-500 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
//                 disabled={isLoading}
//               >
//                 <RotateCcw className="h-5 w-5 mr-2" />
//                 Try Another
//               </button>
//               {/* Button to download the cartoonized image */}
//               <button
//                 onClick={() => {
//                   if (cartoonImage) {
//                     const link = document.createElement('a');
//                     link.href = cartoonImage;
//                     link.download = `ai-cartoonizer-${selectedStyle}-${Date.now()}.png`; // Updated filename
//                     document.body.appendChild(link);
//                     link.click();
//                     document.body.removeChild(link);
//                   }
//                 }}
//                 disabled={!cartoonImage || isLoading}
//                 className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
//               >
//                 <Download className="h-5 w-5 mr-2" />
//                 Download
//               </button>
//             </div>
//           )}

//         </main>
        
//         {/* Footer Section */}
//         <footer className="text-center text-zinc-500 pt-16 pb-4 border-t border-zinc-800 mt-8">
//           <p>&copy; {new Date().getFullYear()} AI-Cartoonizer. All Rights Reserved.</p>
//         </footer>
//       </div>

//       {/* Custom CSS for loader animation and aspect ratio helper classes */}
//       <style>{`
//         /* Loader spinner animation */
//         .loader {
//           border-top-color: #3b82f6; /* Tailwind blue-500 equivalent */
//           animation: spinner 1.5s linear infinite;
//         }
//         @keyframes spinner {
//           0% { transform: rotate(0deg); }
//           100% { transform: rotate(360deg); }
//         }

//         /* Aspect Ratio utility classes for responsive image containers */
//         .aspect-w-4 {
//           position: relative;
//           padding-bottom: 75%; /* (3 / 4) * 100% */
//         }
//         .aspect-w-4 > * {
//             position: absolute;
//             top: 0;
//             left: 0;
//             height: 100%;
//             width: 100%;
//             object-fit: cover;
//         }
//         .aspect-w-4 .object-contain {
//           object-fit: contain;
//         }

//         /* Custom scrollbar for better aesthetics */
//         ::-webkit-scrollbar {
//             width: 8px;
//         }
//         ::-webkit-scrollbar-track {
//             background: #27272a; /* zinc-800 */
//         }
//         ::-webkit-scrollbar-thumb {
//             background: #52525b; /* zinc-600 */
//             border-radius: 4px;
//         }
//         ::-webkit-scrollbar-thumb:hover {
//             background: #3b82f6; /* blue-500 */
//         }
//       `}</style>
//     </div>
//   );
// };

// export default App;

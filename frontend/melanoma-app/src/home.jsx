import React, { useState, useEffect } from "react";
import { useDropzone } from 'react-dropzone';
import { styled } from '@mui/material/styles';
import {
  AppBar, Toolbar, Typography, Avatar, Container, Card, CardContent, 
  Paper, CardActionArea, CardMedia, Grid, TableContainer, Table, TableBody, 
  TableHead, TableRow, TableCell, Button, CircularProgress
} from "@mui/material";
import ClearIcon from '@mui/icons-material/Clear';
import axios from "axios";
import bg from './assets/bg.avif';
import logo from './assets/logo.jpg';

// Assign imported assets to variables for easier reference
const logoPic = logo;
const image = bg;

// Styled button with custom hover effect
const ColorButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText(theme.palette.common.white),
  backgroundColor: theme.palette.common.white,
  '&:hover': {
    backgroundColor: '#ffffff7a',
  },
}));

// Main container with a background image and styles for the main content area
const MainContainer = styled(Container)({
  backgroundImage: `url(${image})`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: 'cover',
  height: "93vh",
  marginTop: "8px",
  backgroundColor: "#f5f5f5",
});

// Dropzone component for file upload
const Dropzone = ({ onDrop }) => {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: 'image/*', // Accept only image files
  });

  return (
    <div {...getRootProps()} style={{ border: '2px dashed #ddd', padding: '20px', textAlign: 'center' }}>
      <input {...getInputProps()} />
      <p>Drag and drop an image of your skin to test for melanoma, or click to select one</p>
    </div>
  );
};

// Main ImageUpload component
export const ImageUpload = () => {
  // States to handle selected file, image preview, API response data, loading state, etc.
  const [selectedFile, setSelectedFile] = useState();
  const [preview, setPreview] = useState();
  const [data, setData] = useState();
  const [image, setImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  let confidence = 0;

  // Function to handle file upload and send it to the backend API
  const sendFile = async () => {
    if (image) {
      let formData = new FormData();
      formData.append("file", selectedFile); // Append file to FormData

      try {
        // Send POST request to backend API with the file
        let res = await axios.post(import.meta.env.VITE_API_URL, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });        
        if (res.status === 200) {
          setData(res.data);  // Save response data to display predictions
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        setIsLoading(false);  // Stop loading animation
      }
    }
  };

  // Function to clear all data and reset the state
  const clearData = () => {
    setData(null);
    setImage(false);
    setSelectedFile(null);
    setPreview(null);
  };

  // useEffect hook to set the preview image when a file is selected
  useEffect(() => {
    if (!selectedFile) {
      setPreview(undefined);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile); // Create object URL for preview
    setPreview(objectUrl);
  }, [selectedFile]);

  // Trigger file upload when preview is ready
  useEffect(() => {
    if (!preview) {
      return;
    }
    setIsLoading(true);
    sendFile();
  }, [preview]);

  // Handle file selection from Dropzone
  const onSelectFile = (files) => {
    if (!files || files.length === 0) {
      setSelectedFile(undefined);
      setImage(false);
      setData(undefined);
      return;
    }
    setSelectedFile(files[0]);
    setData(undefined);
    setImage(true);
  };

  // Calculate confidence percentage if data is available
  if (data) {
    confidence = (parseFloat(data.confidence) * 100).toFixed(2);
  }

  return (
    <React.Fragment>
      {/* Top AppBar with title and logo */}
      <AppBar position="static" sx={{ background: '#6a8abe', boxShadow: 'none', padding: '0 20px' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            Fundamentals of Deep Learning: Melanoma Detection
            <Avatar src={logoPic} />
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main container for the content */}
      <MainContainer maxWidth={false} disableGutters>
        <Grid container justifyContent="center" spacing={2}>
          <Grid item xs={12}>
            {/* Card component for image upload and result display */}
            <Card sx={{ maxWidth: 400, margin: 'auto', boxShadow: 3, borderRadius: '15px', backgroundColor: '#fafafa' }}>
              {image ? (
                <CardActionArea>
                  {/* Display selected image preview */}
                  <CardMedia
                    component="img"
                    height="400"
                    image={preview}
                    alt="Selected Image Preview"
                  />
                </CardActionArea>
              ) : (
                <CardContent>
                  <Dropzone onDrop={(acceptedFiles) => onSelectFile(acceptedFiles)} />
                </CardContent>
              )}
              {data && (
                // Display API response data in a table if available
                <CardContent>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#d8e2dc' }}> {/* Adjust the color here */}
                          <TableCell><strong>Label:</strong></TableCell>
                          <TableCell align="right"><strong>Confidence:</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>{data.class}</TableCell>
                          <TableCell align="right">{confidence}%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              )}
              {isLoading && (
                // Show loading spinner while processing
                <CardContent sx={{ textAlign: 'center' }}>
                  <CircularProgress color="secondary" />
                  <Typography variant="h6">Processing</Typography>
                </CardContent>
              )}
            </Card>
          </Grid>
          {data && (
            // Clear button to reset the form and clear data
            <Grid item>
              <ColorButton
                variant="contained"
                onClick={clearData}
                startIcon={<ClearIcon />}
              >
                Clear
              </ColorButton>
            </Grid>
          )}
        </Grid>
      </MainContainer>
    </React.Fragment>
  );
};

import { useState, useEffect } from "react";
import axios from "axios";
import type { NextPage } from "next";
import {
  Container,
  Box,
  Grid,
  Typography,
  Slider,
  FormControlLabel,
  FormGroup,
  IconButton,
  Button,
  Chip,
  Tooltip,
  Switch,
} from "@mui/material";
import {
  Refresh,
  Add,
  Remove,
  ContentCopy,
  CheckCircle,
} from "@mui/icons-material";
import background from "../assets/background.jpg";

// Interface for the FastAPI response
interface PasswordResponse {
  password: string;
}

const Home: NextPage = () => {
  // State declarations
  const [length, setLength] = useState<number>(15);
  const [useUppercase, setUseUppercase] = useState<boolean>(true);
  const [useLowercase, setUseLowercase] = useState<boolean>(true);
  const [useNumbers, setUseNumbers] = useState<boolean>(true);
  const [useSymbols, setUseSymbols] = useState<boolean>(true);
  const [password, setPassword] = useState<string>("");
  const [passwordStrength, setPasswordStrength] = useState<string>("Very Weak");
  const [copied, setCopied] = useState<boolean>(false);
  const [displayedPassword, setDisplayedPassword] = useState<string>(""); 

  const getEstimatedCrackTime = (
    length: number
  ): { text: string; color: string } => {
    if (length > 14) return { text: "Centuries", color: "green" };
    if (length === 14) return { text: "10 years", color: "green" };
    if (length === 13) return { text: "3 years", color: "green" };
    if (length >= 11) return { text: "4 months", color: "orange" };
    if (length === 10) return { text: "12 days", color: "orange" };
    if (length === 9) return { text: "1 day", color: "red" };
    if (length === 8 || length === 7)
      return { text: "17 minutes", color: "red" };
    if (length < 7) return { text: "In minutes", color: "red" };
    return { text: "Unknown", color: "gray" };
  };
  const { text: crackTimeText, color: crackTimeColor } =
    getEstimatedCrackTime(length);

  // Helper function to ensure at least one option remains selected
  const toggleOption = (
    option: "uppercase" | "lowercase" | "numbers" | "symbols"
  ) => {
    const countSelected = [useUppercase, useLowercase, useNumbers, useSymbols].filter(Boolean).length;
  
    if (
      (option === "uppercase" && useUppercase && countSelected === 1) ||
      (option === "lowercase" && useLowercase && countSelected === 1) ||
      (option === "numbers" && useNumbers && countSelected === 1) ||
      (option === "symbols" && useSymbols && countSelected === 1)
    ) {
      return;
    }
  
    switch (option) {
      case "uppercase":
        setUseUppercase(!useUppercase);
        break;
      case "lowercase":
        setUseLowercase(!useLowercase);
        break;
      case "numbers":
        setUseNumbers(!useNumbers);
        break; 
      case "symbols":
        setUseSymbols(!useSymbols);
        break;
      default:
        break;
    }
  };
  

  // Basic strength checker
  const getPasswordStrength = (pwd: string): string => {
    let score = 0;
    const conditions = [
      /[A-Z]/.test(pwd),
      /[a-z]/.test(pwd),
      /\d/.test(pwd),
      /[^A-Za-z0-9]/.test(pwd),
    ];
    // Length-based scoring (max 2 points)
    if (pwd.length >= 4) score++;
    if (pwd.length >= 4 && conditions.filter(Boolean).length >= 1) {
      score++;
    }
    // Letter variety: reward a mix of uppercase and lowercase (max 1 point)
    if (pwd.length >= 8 && conditions.filter(Boolean).length >= 2) {
      score++;
    }
    if (pwd.length >= 10 && conditions.filter(Boolean).length >= 2) {
      score++;
    }
    // Symbol presence (max 1 point)
    if (pwd.length >= 12 && conditions.filter(Boolean).length >= 2) {
      score++;
    }
    // Total score maximum is 5; switch returns the strength label
    switch (score) {
      case 0:
      case 1:
        return "Very Weak";
      case 2:
        return "Weak";
      case 3:
        return "Good";
      case 4:
        return "Strong";
      case 5:
        return "Very Strong";
      default:
        return "Unknown";
    }
  };

  // Map strength to MUI chip color
  const getStrengthChipColor = (strength: string) => {
    switch (strength) {
      case "Very Weak":
        return "error";
      case "Weak":
        return "warning";
      case "Good":
        return "info";
      case "Strong":
      case "Very Strong":
        return "success";
      default:
        return "default";
    }
  };

  // Fetch a new password from FastAPI
  const fetchPassword = async () => {
    try {
      const response = await axios.post<PasswordResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/generate-password`,
        {
          length,
          use_uppercase: useUppercase,
          use_lowercase: useLowercase,
          use_numbers: useNumbers,
          use_symbols: useSymbols,
        }
      );
      setPassword(response.data.password);
      setPasswordStrength(getPasswordStrength(response.data.password));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error response from server:", error.response?.data);
      } else {
        console.error("Unknown error:", error);
      }
    }
  };

  // Typing effect: update displayedPassword gradually when password changes
  useEffect(() => {
    // If the password is very short, display it immediately.
    if (password.length <= 1) {
      setDisplayedPassword(password);
      return;
    }

    let index = -1;
    setDisplayedPassword(""); // Reset displayed password
    const intervalId = setInterval(() => {
      setDisplayedPassword((prev) => prev + password.charAt(index));
      index++;
      if (index >= password.length) {
        clearInterval(intervalId);
      }
    }, 30);
    return () => clearInterval(intervalId);
  }, [password]);

  // Copy password to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPassword();
  }, []);

  // Automatically regenerate when options change
  useEffect(() => {
    fetchPassword();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, useUppercase, useLowercase, useNumbers, useSymbols]);

  // Handle slider changes
  const handleSliderChange = (e: Event, newValue: number | number[]) => {
    setLength(newValue as number);
  };

  return (
    <Box
    sx={{
      backgroundImage: `url(${background.src})`,
      backgroundColor: "rgb(25,39,51)",
      backgroundSize: "cover",
      backgroundPosition: "center",
      minHeight: "100vh", // ✅ This ensures it covers the full screen height
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      p: 1,
    }}
  >
  
      <Container maxWidth="md">
        {/* Heading */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h3" fontWeight="bold" gutterBottom color="white">
            Random Password Generator
          </Typography>
        </Box>

        {/* Main Box with password display */}
        <Box
          sx={{
            backgroundColor: "#fff",
            borderRadius: 2,
            boxShadow: 3,
            p: 4,
            mb: 4,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            {/* Password display and refresh icon */}
            <Grid item xs={9}>
              <Box
                sx={{
                  backgroundColor: "#f4f4f4",
                  borderRadius: 2,
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: "3em", 
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ fontFamily: "monospace", wordWrap: "break-word" }}
                >
                  {displayedPassword}
                </Typography>
                {/* Wrap the chip and refresh icon in a flex container */}
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Chip
                    label={`${passwordStrength}`}
                    color={getStrengthChipColor(passwordStrength)}
                    variant="filled"
                    sx={{ fontWeight: "bold", mr: 1 }}
                  />
                  <Tooltip title="Refresh password">
                    <IconButton onClick={fetchPassword}>
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Grid>

            {/* Copy button */}
            <Grid item>
              <Box textAlign="center">
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={copied ? <CheckCircle /> : <ContentCopy />}
                  onClick={copyToClipboard}
                  sx={{ px: 4, py: 1.5, borderRadius: 10 }}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Password length controls */}
        <Box
          sx={{
            backgroundColor: "#fff",
            borderRadius: 2,
            boxShadow: 3,
            p: 4,
            mb: 4,
          }}
        >
          <Typography variant="h6" fontWeight="medium" mb={1}>
            Password length: {length}
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton
              onClick={() => setLength((prev) => Math.max(1, prev - 1))}
              color="primary"
            >
              <Remove />
            </IconButton>
            <Slider
              min={1}
              max={30}
              value={length}
              onChange={handleSliderChange}
              sx={{ flex: 1 }}
            />
            <IconButton
              onClick={() => setLength((prev) => Math.min(30, prev + 1))}
              color="primary"
            >
              <Add />
            </IconButton>
          </Box>
        </Box>

        {/* Character sets */}
        <Box
          sx={{
            backgroundColor: "#fff",
            borderRadius: 2,
            boxShadow: 3,
            p: 4,
            mb: 4,
          }}
        >
          <Typography variant="h6" fontWeight="medium" mb={2}>
            Characters used:
          </Typography>
          <FormGroup row sx={{ justifyContent: "center" }}>
            <FormControlLabel
              control={
                <Switch
                  checked={useUppercase}
                  onChange={() => toggleOption("uppercase")}
                />
              }
              label="ABC"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={useLowercase}
                  onChange={() => toggleOption("lowercase")}
                />
              }
              label="abc"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={useNumbers}
                  onChange={() => toggleOption("numbers")}
                />
              }
              label="123"
            />
            <FormControlLabel
              control={
                <Switch
                  sx={{
                    color: "black",
                    "&.Mui-checked": {
                      color: "black",
                    },
                    "& .MuiSwitch-track": {
                      backgroundColor: "black",
                    },
                  }}
                  checked={useSymbols}
                  onChange={() => toggleOption("symbols")}
                />
              }
              label="#$&"
            />
          </FormGroup>
        </Box>
        <Box
          sx={{
            backgroundColor: "#fff",
            borderRadius: 2,
            boxShadow: 3,
            p: 4,
          }}
        >
          <Typography variant="h6" fontWeight="medium" mb={1}>
            Estimated time to crack:
          </Typography>
          <Typography variant="h4" sx={{ color: crackTimeColor }}>
            {crackTimeText}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Home;

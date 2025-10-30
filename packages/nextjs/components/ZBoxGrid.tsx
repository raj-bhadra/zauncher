import CreateIcon from "@mui/icons-material/Create";
import KeyIcon from "@mui/icons-material/Key";
import LockIcon from "@mui/icons-material/Lock";
import LockClockIcon from "@mui/icons-material/LockClock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockPersonIcon from "@mui/icons-material/LockPerson";
import { Box, Grid, Paper, Typography } from "@mui/material";

/**
 * A 3x3 grid of the letter 'Z'.
 * This uses the dedicated MUI Grid component.
 */
function ZGridComponent() {
  // Create an array to map over, just to generate 9 items
  const items = Array.from(Array(24));
  const indexToIcon = (index: number) => {
    if (index % 7 === 0) return "z";
    if (index % 7 === 1) return <CreateIcon />;
    if (index % 7 === 2) return <KeyIcon />;
    if (index % 7 === 3) return <LockOpenIcon />;
    if (index % 7 === 4) return <LockClockIcon />;
    if (index % 7 === 5) return <LockPersonIcon />;
    if (index % 7 === 6) return <LockIcon />;
  };

  return (
    <Box sx={{ flexGrow: 1, padding: 2, maxWidth: "40vw", maxHeight: "80vh", overflow: "hidden" }}>
      {/* The 'container' prop defines the grid container.
          The 'spacing' prop is the "spacing" between items. */}
      <Grid container spacing={2}>
        {items.map((_, index) => (
          // The 'item' prop defines the grid item.
          // 'xs={4}' means it takes 4 of 12 columns (12 / 4 = 3 items per row).
          <Grid
            key={index}
            component="div"
            sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 70 }}
            size={{ xs: 2 }}
          >
            <Paper
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 80,
              }}
            >
              <Typography variant="h4">{indexToIcon(index)}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default ZGridComponent;

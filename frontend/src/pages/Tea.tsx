import React from "react";
import PageHeader from "../components/PageHeader";
import { Typography, List, ListItem, ListItemText } from "@mui/material";
import { useTranslation } from "react-i18next";

const Tea = () => {
  const { t } = useTranslation();

  const teaTypes = [
    { name: "Green Tea", description: "Light and refreshing, rich in antioxidants" },
    { name: "Black Tea", description: "Full-bodied and robust, often used for breakfast teas" },
    { name: "Oolong Tea", description: "Partially oxidized, with a range of flavors" },
    { name: "White Tea", description: "Delicate and subtle, minimally processed" },
    { name: "Herbal Tea", description: "Caffeine-free, made from herbs, fruits, and spices" }
  ];

  return (
    <>
      <PageHeader />
      <Typography variant="body1" paragraph>
        {t("tea.introduction")}
      </Typography>
      <List>
        {teaTypes.map((tea, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={tea.name}
              secondary={tea.description}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
};

export default Tea;

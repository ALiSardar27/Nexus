import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "", ...rest }) => {
  return (
    <div className={`bg-white shadow rounded-md ${className}`} {...rest}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = "", ...rest }) => {
  return (
    <div className={`p-4 border-b font-semibold ${className}`} {...rest}>
      {children}
    </div>
  );
};

export const CardBody: React.FC<CardProps> = ({ children, className = "", ...rest }) => {
  return (
    <div className={`p-4 ${className}`} {...rest}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({ children, className = "", ...rest }) => {
  return (
    <div className={`p-4 border-t ${className}`} {...rest}>
      {children}
    </div>
  );
};
export default Card;

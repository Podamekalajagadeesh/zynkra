import React from 'react';
import { Link } from 'react-router-dom';

interface RichTextProps {
  text: string;
  font?: string | null;
}

export const RichText: React.FC<RichTextProps> = ({ text, font }) => {
  const getFontStyle = () => {
    switch (font) {
      case 'serif':
        return { fontFamily: 'Merriweather, serif' };
      case 'mono':
        return { fontFamily: '"Space Mono", monospace' };
      case 'cursive':
        return { fontFamily: 'Caveat, cursive', fontSize: '1.25rem' };
      case 'fantasy':
        return { fontFamily: 'Bungee, cursive' };
      case 'italic':
        return { fontStyle: 'italic' };
      case 'bold':
        return { fontWeight: 'bold' };
      default:
        return {};
    }
  };

  const renderText = () => {
    const parts = text.split(/([@#]\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.substring(1);
        return (
          <Link key={index} to={`/user/${username}`} className="text-blue-500 hover:underline">
            {part}
          </Link>
        );
      }
      if (part.startsWith('#')) {
        const tag = part.substring(1);
        return (
          <Link key={index} to={`/tags/${tag}`} className="text-blue-500 hover:underline">
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  return <p className="text-dark-500" style={getFontStyle()}>{renderText()}</p>;
};
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getTokenColor } from '@/utils/colorTokens';
import { Token } from '@/types/sop';

interface InlineTagRendererProps {
  description: string;
  tokens: Token[];
  onTagClick?: (token: Token) => void;
}

export const InlineTagRenderer: React.FC<InlineTagRendererProps> = ({ 
  description, 
  tokens, 
  onTagClick 
}) => {
  // Safety check for undefined description
  if (!description) {
    return <div className="leading-relaxed text-muted-foreground">No description available</div>;
  }

  const renderDescriptionWithTags = () => {
    const processedDescription = description;
    const elements: React.ReactNode[] = [];
    
    // Create a map of @TAG patterns to tokens - @ symbol should disappear
    const tokenMap = new Map<string, Token>();
    tokens.forEach(token => {
      // Map @TOKEN to token (@ will be removed in replacement)
      tokenMap.set(`@${token.value}`, token);
      
      // Handle common action patterns like @ADD(modifier 25)
      if (token.type === 'action') {
        // Handle patterns like @ADD(modifier 25) and @REMOVE(modifier 25)
        const actionPattern = `@${token.value}`;
        tokenMap.set(actionPattern, token);
        
        // Also handle wrapped patterns
        if (token.value.includes(' ')) {
          const parts = token.value.split(' ');
          if (parts.length >= 2) {
            const wrappedPattern = `@${parts[0]}(${parts.slice(1).join(' ')})`;
            tokenMap.set(wrappedPattern, token);
          }
        }
      }
    });
    
    // Sort patterns by length (longest first) to avoid partial replacements
    const patterns = Array.from(tokenMap.keys()).sort((a, b) => b.length - a.length);
    
    let lastIndex = 0;
    const replacements: Array<{start: number, end: number, token: Token}> = [];
    
    // Find all matches
    patterns.forEach(pattern => {
      let index = processedDescription.indexOf(pattern);
      while (index !== -1) {
        const end = index + pattern.length;
        // Check if this position is already covered by a longer match
        const isOverlapping = replacements.some(r => 
          (index >= r.start && index < r.end) || (end > r.start && end <= r.end)
        );
        
        if (!isOverlapping) {
          replacements.push({
            start: index,
            end: end,
            token: tokenMap.get(pattern)!
          });
        }
        
        index = processedDescription.indexOf(pattern, index + 1);
      }
    });
    
    // Sort replacements by start position
    replacements.sort((a, b) => a.start - b.start);
    
    // Build the final elements
    lastIndex = 0;
    replacements.forEach((replacement, index) => {
      // Add text before token
      if (replacement.start > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>
            {processedDescription.substring(lastIndex, replacement.start)}
          </span>
        );
      }
      
      // Add token as pill - very compact and inline
      elements.push(
        <span
          key={`token-${index}`}
          className="cursor-pointer hover:opacity-80"
          style={{ 
            display: 'inline',
            backgroundColor: getTokenColor(replacement.token.type, replacement.token.value),
            color: 'white',
            fontSize: '10px',
            fontWeight: '500',
            padding: '1px 4px',
            borderRadius: '4px',
            margin: '0 1px',
            verticalAlign: 'baseline',
            lineHeight: '1'
          }}
          onClick={() => onTagClick?.(replacement.token)}
        >
          {replacement.token.value}
        </span>
      );
      
      lastIndex = replacement.end;
    });
    
    // Add remaining text
    if (lastIndex < processedDescription.length) {
      elements.push(
        <span key="text-end">
          {processedDescription.substring(lastIndex)}
        </span>
      );
    }
    
    return elements;
  };
  
  return <div className="leading-relaxed text-sm">{renderDescriptionWithTags()}</div>;
};
const required = (key: string, defaultValue = undefined) => {
    const value = import.meta.env[key] || process.env[key] || defaultValue;
    if (value == null) {
      throw new Error(`Key ${key} is undefined`);
    }
    return value;
  };
  export default { backurl : required("VITE_REACT_APP_BACKEND"),whisperurl : required("VITE_REACT_APP_WHISPER") };
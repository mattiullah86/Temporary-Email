import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Clipboard,Share,ToastAndroid } from 'react-native';
import axios from 'axios';
import WebView from 'react-native-webview';
import RNFetchBlob from 'rn-fetch-blob';

const App = () => {
  const [email, setEmail] = useState('');
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    generateEmail();
    checkMessages(email);
  }, []);

  const generateEmail = async () => {
    try {
      const response = await axios.get('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1');
      const { data } = response;
      setEmail(data[0]);
    } catch (error) {
      ToastAndroid.show('Wait for few time and try again later', ToastAndroid.SHORT);
      console.error(error);
    }
  };
  function handleBack() {
    setSelectedMessage(null);
  }
  const checkMessages = async (email) => {
    try {
      const response = await axios.get(`https://www.1secmail.com/api/v1/?action=getMessages&login=${email.split('@')[0]}&domain=${email.split('@')[1]}`);

      const { data } = response;
      setMessages(data);
      console.warn(data.id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRefresh = () => {
    ToastAndroid.show('Refreshing...', ToastAndroid.SHORT);
    checkMessages(email);
  };

  const handleDelete = async () => {
    try {
      await axios.get(`https://www.1secmail.com/api/v1/?action=deleteMailbox&login=${email.split('@')[0]}&domain=${email.split('@')[1]}`);
      generateEmail();
      setMessages([]);
      setSelectedMessage(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopy = () => {
    Clipboard.setString(email);
    ToastAndroid.show('Copied', ToastAndroid.SHORT);
  };

  const handleMessagePress = async (message) => {
    try {
      const res=await axios.get(`https://www.1secmail.com/api/v1/?action=readMessage&login=${email.split('@')[0]}&domain=${email.split('@')[1]}&id=${message.id}`);
      const {data}=res;
      setSelectedMessage(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleShare = () => {
    const message = selectedMessage;
    if (!message) return;
  
    Share.share({
      message: `Subject: ${message.subject}\n\n${message.textBody}`,
      title: `Email from ${email}`,
    });
  };
  const handleDownload = async () => {
    if (selectedMessage.attachments.length === 0) {
      ToastAndroid.show('No attachments to download', ToastAndroid.SHORT);
      return;
    }

    for (const attachment of selectedMessage.attachments) {
      const attachmentUrl = `https://www.1secmail.com/api/v1/?action=download&login=${email.split('@')[0]}&domain=${email.split('@')[1]}&id=${selectedMessage.id}&file=${attachment.filename}`;
RNFetchBlob.config({
  fileCache: true,
  addAndroidDownloads: {
    useDownloadManager: true,
    notification: true,
    mediaScannable: true,
    title: attachment.filename,
    mime: attachment.contentType,
    path: `${RNFetchBlob.fs.dirs.DownloadDir}/${attachment.filename}`,
  },
})
.fetch('GET', attachmentUrl, {})
.then((res) => {
  // Open the downloaded file using a file manager app
  RNFetchBlob.android.actionViewIntent(res.path(), selectedMessage.contentType);
})
.catch((error) => {
  console.log(error);
  ToastAndroid.show('Error downloading attachment', ToastAndroid.SHORT);
});
    }
  }
  
  const renderMessage = (message) => {
    return (
      <TouchableOpacity
        key={message.id}
        style={[styles.message, selectedMessage && selectedMessage.id === message.id && styles.selectedMessage]}
        onPress={() => handleMessagePress(message)}
      >
        <Text style={styles.messageFrom}>{message.from}</Text>
        <Text style={styles.messageSubject}>{message.subject}</Text>
        <Text numberOfLines={1}>{message.date}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Temporary Email</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Text style={styles.headerButton}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCopy}>
          <Text style={styles.headerButton}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={[styles.headerButton, styles.deleteButton]}>Delete</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.emailContainer}>
        <Text style={styles.email}>{email}</Text>
      </View>
      
      {selectedMessage ? (
        <View style={{flex:1}}>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={handleBack} style={{ width: "25%", top: 2 }}>
              <Text style={[styles.headerButton, styles.backButton, { textAlign: "center", fontSize: 17 }]}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={{ width: "25%", top: 2, marginLeft: 5 }}>
              <Text style={[styles.headerButton, styles.backButton, { textAlign: "center", fontSize: 17 }]}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDownload} style={{width:"26%",top:2}}>
              <Text style={[styles.headerButton, styles.backButton,{textAlign:"center",fontSize:17}]}>Download</Text>
            </TouchableOpacity>
          </View>
          
          <WebView
          source={{
            html: selectedMessage.htmlBody,
            uri: `https://www.1secmail.com/api/v1/?action=readMessage&login=${email.split('@')[0]}&domain=${email.split('@')[1]}&id=${selectedMessage.id}`,
          }}
          style={styles.webView}
          automaticallyAdjustContentInsets={true}
          />
        </View>
          ) : (
          <ScrollView style={styles.messagesContainer}>
          {messages.length > 0 ? (
          messages.map(renderMessage)
          ) : (
          <Text style={styles.noMessagesText}>No messages</Text>
          )}
          </ScrollView>
          )}
          </View>
          );
          };
          
          const styles = StyleSheet.create({
          container: {
          flex: 1,
          backgroundColor: '#fff',
          },
          header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#555',
          height: 60,
          paddingHorizontal: 20,
          },
          title: {
          color: '#fff',
          fontSize: 20,
          },
          headerButton: {
          color: '#fff',
          fontSize: 16,
          marginLeft: 10,
          },
          deleteButton: {
          backgroundColor: '#f00',
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 5,
          },
          backButton: {
            backgroundColor: '#555',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 5,
          },
          emailContainer: {
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#ccc',
          },
          email: {
          fontSize: 18,
          fontWeight: 'bold',
          },
          messagesContainer: {
          flex: 1,
          padding: 20,
          },
          message: {
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: '#ccc',
          },
          selectedMessage: {
          backgroundColor: '#eee',
          },
          messageFrom: {
          fontWeight: 'bold',
          },
          messageSubject: {
          fontWeight: 'bold',
          marginTop: 5,
          marginBottom: 10,
          },
          noMessagesText: {
          textAlign: 'center',
          fontSize: 16,
          color: '#888',
          },
          webView: {
          flex: 1,
          },
          });
          
          export default App;
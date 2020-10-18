import React from 'react';
import { toFormatLink, toFormat } from '../public/scripts/MessageFormatter'

export default class Send extends React.Component {
  state = {
    message: "",
    currentEmotes: [],
    currentEmoteIndex: 0,
    currentMentions: [],
    currentMentionIndex: 0
  };

  componentDidMount = () => {
    //Keyboard hooks
    document.onkeydown = function(evt) {
      evt = evt || window.event;
      if (evt.keyCode === 40) {
        evt.preventDefault();
        if(this.state.currentEmotes.length > 0) {
          this.setState({
            currentEmoteIndex: this.state.currentEmotes.length - 1 === this.state.currentEmoteIndex ? 0 : this.state.currentEmoteIndex + 1
          })
        } else if(this.state.currentMentions.length > 0) {
          this.setState({
            currentMentionIndex: this.state.currentMentions.length - 1 === this.state.currentMentionIndex ? 0 : this.state.currentMentionIndex + 1
          })
        }
      } else if (evt.keyCode === 38) {
        evt.preventDefault();
        if(this.state.currentEmotes.length > 0) {
          this.setState({
            currentEmoteIndex: this.state.currentEmoteIndex === 0 ? this.state.currentEmotes.length - 1 : this.state.currentEmoteIndex - 1
          })
        } else if(this.state.currentMentions.length > 0) {
          this.setState({
            currentMentionIndex: this.state.currentMentionIndex === 0 ? this.state.currentMentions.length - 1 : this.state.currentMentionIndex - 1
          })
        }
      } 
    }.bind(this);
  }

  handleChange = e => {
    let message = e.target.value;
    let server = this.props.getServer(this.props.selectedServer)
    let channel = this.props.getChannel(this.props.currentChannel)
    let members = server !== undefined ? server.members : channel.members;
    members = members.reduce((acc, curr) => { acc.push(this.props.getUser(curr)); return acc; }, [])

    let a0 = message.lastIndexOf(":");
    let a = message.substring(a0 > -1 ? a0 + 1 : message.length)
    let possibleEmotes = Array.from(this.props.emotes.values()).filter(e => { return (e.author.id === this.props.session.userID || (e.server !== undefined && this.props.isInServer(e.server.id))) && a.length > 0 && e.name.startsWith(a); })
    let b0 = message.lastIndexOf("@");
    let b = message.substring(b0 > -1 ? b0 + 1 : message.length)
    let possibleMentions = members.filter(e => { return b.length > 0 && e.username.startsWith(b); })

    this.setState({
      message: message,
      currentEmotes: possibleEmotes,
      currentEmoteIndex: this.state.currentEmoteIndex >= possibleEmotes.length ? (possibleEmotes.length === 0 ? 0 : possibleEmotes.length - 1) : this.state.currentEmoteIndex,
      currentMentions: possibleMentions,
      currentMentionIndex: this.state.currentMentionIndex >= possibleMentions.length ? (possibleMentions.length === 0 ? 0 : possibleMentions.length - 1) : this.state.currentMentionIndex
    });
  }

  handleSubmit = async e => {
    e.preventDefault();

    if(this.state.currentEmotes[this.state.currentEmoteIndex] !== undefined) {
      let b = this.state.message.substring(0, this.state.message.lastIndexOf(":"))
      this.handleChange({ target: { value: b + "<:" + this.state.currentEmotes[this.state.currentEmoteIndex].id + ":>" }})
    } else if(this.state.currentMentions[this.state.currentMentionIndex] !== undefined) {
      let b = this.state.message.substring(0, this.state.message.lastIndexOf("@"))
      this.handleChange({ target: { value: b + "<@" + this.state.currentMentions[this.state.currentMentionIndex].id + ">" }})
    } else {
      this.handleChange({ target: { value: "" }})
      if(await this.props.API.API_sendMessage(this.state.message)) {
        this.setState({
          message: "",
        });
      }
    }
  }

  handleFile = async e => {
    if(e.target.files.length < 1) { return; }
    
    var file = e.target.files[0];
    e.target.value = ""
    if(await this.props.API.API_sendFile(file, this.state.message)) {
      this.setState({
        message: "",
      });
    }
  }

  render() {
    if(this.props.isInChannel() === false) {
      return null;
    }

    let emoteList = this.state.currentEmotes.map((emote, i) => {
      let server = emote.server !== undefined ? this.props.getServer(emote.server.id) : undefined;

      return <div className="emoteItemWrapper" key={i}>
        <div className={this.state.currentEmoteIndex === i ? "emoteItem bgColor" : "emoteItem"} onClick={(e) => { this.setState({ currentEmoteIndex: i }); this.handleSubmit(e); }}>
          <div className="flex" style={{ flex: "1 1 auto" }}>
            <img alt="" className="emoteImage marginleft2" src={this.props.fileEndpoint + "/" + emote.file} />
            <div className="white text5 marginleft2">
              :{emote.name}:
            </div>
          </div>
          <div className="flex">
            <div className="tooltipColor text5 marginright3">
              from {server !== undefined ? server.name : "Personal Emotes"}
            </div>
          </div>
        </div>
      </div>
    })

    let mentionList = this.state.currentMentions.map((member, i) => {
      return <div className="emoteItemWrapper" key={i}>
        <div className={this.state.currentMentionIndex === i ? "emoteItem bgColor" : "emoteItem"} onClick={(e) => { this.setState({ currentMentionIndex: i }); this.handleSubmit(e); }}>
          <div className="flex" style={{ flex: "1 1 auto" }}>
            <img alt="" className="emoteImage marginleft2" src={this.props.fileEndpoint + "/" + member.avatar} />
            <div className="white text5 marginleft2">
              @{member.username}
            </div>
          </div>
          <div className="flex">
            <div className="tooltipColor text5 marginright3">
              {member.username}
            </div>
          </div>
        </div>
      </div>
    })

    return (
      <div className="marginleft2 margintop1" style={{ marginTop: this.state.currentEmotes.length > 0 || this.state.currentMentions.length > 0 ? -200 : 10 }}>
        <div className="emoteSelector" style={{ display: this.state.currentEmotes.length > 0 || this.state.currentMentions.length > 0 ? "block" : "none" }}>
          {emoteList}
          {mentionList}
        </div>
        <div className="flex">
          <label for="file-input">
            <div className="full alignmiddle chatColor">
              <i className="fa fa-image file-icon"></i>
            </div>
          </label>
          <input id="file-input" className="hide" onChange={this.handleFile} type='file' name="fileUploaded"/>
          <form onSubmit={this.handleSubmit} className="full">
            <input className="input-message chatColor" type="text" value={this.state.message} placeholder="Message..." required={true} onChange={this.handleChange}/>
          </form>
        </div>
      </div>
    );
  }
}
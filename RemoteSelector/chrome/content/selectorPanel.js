/* See license.txt for terms of usage */

define([
    "firebug/lib/object",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/domplate",
    "remoteselector/selectorClient",
],
function(Obj, FBTrace, Locale, Domplate, SelectorClient) {

// ********************************************************************************************* //
// Constants

FBTrace = FBTrace.to("DBG_REMOTESELECTOR");

// ********************************************************************************************* //
// Custom Panel Implementation

var panelName = "remoteSelector";

function SelectorPanel() {};
SelectorPanel.prototype = Obj.extend(Firebug.Panel,
{
    name: panelName,
    title: "Remote Selector",
    remotable: true,

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Initialization

    initialize: function()
    {
        Firebug.Panel.initialize.apply(this, arguments);

        FBTrace.sysout("remoteSelector; SelectorPanel.initialize");

        Firebug.connection.addListener(this);

        this.refresh();
    },

    destroy: function(state)
    {
        Firebug.connection.removeListener(this);

        FBTrace.sysout("remoteSelector; SelectorPanel.destroy");

        Firebug.Panel.destroy.apply(this, arguments);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Connection

    onConnect: function(proxy)
    {
        FBTrace.sysout("remoteSelector;selectorPanel.onConnect");

        var self = this;
        proxy.connection.listTabs(function(response)
        {
            var tab = response.tabs[response.selected];
            proxy.connection.attachTab(tab.actor, function(response)
            {
                self.onTabAttached(proxy.connection, tab.actor);
            });
        });
    },

    onDisconnect: function(proxy)
    {
        FBTrace.sysout("remoteSelector;selectorPanel.onDisconnect");

        proxy.connection.detachTab(function(response)
        {
            FBTrace.sysout("remoteSelector;tab detached");
        });

        this.selectorClient = null;
    },

    onTabAttached: function(connection, tabActor)
    {
        FBTrace.sysout("remoteSelector; selectorModule.onTabAttached", arguments);

        var packet = {
            to: tabActor,
            type: "SelectorActor"
        }

        var self = this;
        connection.request(packet, function(response)
        {
            FBTrace.sysout("remoteSelector; on selector actor received", response);
            self.selectorClient = new SelectorClient(connection, response.actor);
        });
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Panel

    refresh: function()
    {
        this.MyTemplate.render(this.panelNode);
    }
});

// ********************************************************************************************* //
// Panel UI (Domplate)

// Register locals before the following template definition.
Firebug.registerStringBundle("chrome://remoteselector/locale/remoteselector.properties");

/**
 * Domplate template used to render panel's content. Note that the template uses
 * localized strings and so, Firebug.registerStringBundle for the appropriate
 * locale file must be already executed at this moment.
 */
with (Domplate) {
SelectorPanel.prototype.MyTemplate = domplate(
{
    tag:
        SPAN(
            Locale.$STR("remoteselector.panel.label")
        ),

    render: function(parentNode)
    {
        this.tag.replace({}, parentNode);
    }
})}

// ********************************************************************************************* //
// Registration

Firebug.registerPanel(SelectorPanel);
Firebug.registerStylesheet("chrome://remoteselector/skin/remoteselector.css");

return SelectorPanel;

// ********************************************************************************************* //
});
//ScenarioListBox.js
//Version: ael 1.1
//This borrows heavily from ListBox.js, created by Samir Nigam: nigam.samir@hotmail.com

function ListBox(Arguments) {
    //Public property Version.
    this.Version = '1.1';

    this.SelectionInitialText = null;  // the value when the item first obtained focus

    //Local variables.
    var EventHandlers = new Array();
    var SelectedIndex = null;   // the item currently being edited, whether in this list or a sync'd one

    var ListsToSync = new Array();
    var Colours = ['#C1C0C0', '#6090CE', '#E0E059', '#FF6565', '#56D856', '#907B4F', '#ED9CCD', '#5CCBCB', '#FFB265', '#B96AE8', '#4F904F', '#828181'];
    var ItemType = Arguments.Type ? Arguments.Type : "text";    // one day we might add "number"
    if (ItemType == "tangle")
    {
    var RangeMin = Arguments.RangeMin;
    var RangeMax = Arguments.RangeMax;
    var RangeStep = Arguments.RangeStep ? Arguments.RangeStep : 1;
    var InitialValue = Arguments.InitialValue ? Arguments.InitialValue : RangeMin;
    var Tangles = new Array();
    }

    var Base = Arguments.Base ? Arguments.Base : document.documentElement;
    var Size = Arguments.Rows && Arguments.Rows > 5 ? Arguments.Rows : 6;
    var Width = Arguments.Width ? Arguments.Width : 300;
    var NormalItemColor = Arguments.NormalItemColor ? Arguments.NormalItemColor : 'Black';
    var NormalItemBackColor = Arguments.NormalItemBackColor ? Arguments.NormalItemBackColor : '#ffffff';
    var NormalItemBorderColor = Arguments.NormalItemBorderColor ? Arguments.NormalItemBorderColor : '#ffffff';
    var SelectedItemColor = Arguments.SelectedItemColor ? Arguments.SelectedItemColor : '#ffffff';
    var SelectedItemBackColor = Arguments.SelectedItemBackColor ? Arguments.SelectedItemBackColor : '#E0E0E0';
    var SelectedItemBorderColor = Arguments.SelectedItemBorderColor ? Arguments.SelectedItemBorderColor : '#E0E0E0';

    // events for the outside world:
    // SelectionsChanged - the items selected, and/or their contents, have changed

    var SelectionsChangedHandler = Arguments.SelectionsChangedHandler ? Arguments.SelectionsChangedHandler : function () { };

    //Create div for list box.  This is the element that holds all the items as children.
    var ListBoxDiv = document.createElement('div');
    ListBoxDiv.style.backgroundColor = '#ffffff';
    ListBoxDiv.style.textAlign = 'left';
    ListBoxDiv.style.verticalAlign = 'top';
    ListBoxDiv.style.cursor = 'default';
    ListBoxDiv.style.borderStyle = 'inset';
    ListBoxDiv.style.borderWidth = '2px';
    ListBoxDiv.style.overflow = 'auto';
    ListBoxDiv.style.width = Width + 'px';
    ListBoxDiv.style.height = (Size * 22) + 'px';


    //Public method SetSynchronisedLists
    this.SetSynchronisedLists = function (lists) {
        // set up our ListsToSync s.t. the first entry is the next box in the tab cycle,
        // last entry is the previous box
        var list = null;
        ListsToSync = new Array();

        var thisListIndex = lists.indexOf(this);
        for (i = thisListIndex+1; i < lists.length; i++) ListsToSync.push(lists[i]);
        for (i = 0; i < thisListIndex; i++) ListsToSync.push(lists[i]);
    }

    // method addItem
    // create an item and add it as a sibling following the specified child
    this.addItem = function (_Text, _Value, prevSibling) {
        var Item = null;
        var CheckBox = null;
        var CBSpan = null;
        var TextSpan = null;

        var ListBox = this; "used in setting up event handlers"

        Item = document.createElement('div');
        Item.style.backgroundColor = NormalItemBackColor;
        Item.style.color = NormalItemColor;
        Item.style.fontWeight = 'normal';
        Item.style.fontFamily = 'Verdana';
        Item.style.fontSize = '12pt';
        Item.style.textAlign = 'left';
        Item.style.verticalAlign = 'middle';
        Item.style.cursor = 'default';
        //Item.style.borderTop = '1px solid ' + NormalItemBackColor;
        //Item.style.borderBottom = '1px solid ' + NormalItemBackColor;
        Item.style.overflow = 'hidden';
        Item.style.textOverflow = 'ellipsis';

        CBSpan = document.createElement('span');
        CBSpan.id = 'cbSpan';
        CheckBox = document.createElement('input');
        CheckBox.type = 'checkbox';
        CheckBox.id = 'checkbox';
        CheckBox.addEvent('click', function (event) { OnCheckboxClick(Item, event, ListBox) });
        CBSpan.appendChild(CheckBox);
        Item.checkboxColour = null;
        Item.appendChild(CBSpan);


        if (ItemType == "text") {
            var TextBox = document.createElement('input');
            TextBox.type = 'text';
            TextBox.id = 'listItem';
            TextBox.defaultValue = _Text;
            TextBox.style.borderWidth = '0px';

            //Register events
            TextBox.addEvent('keydown', function (event) { OnTextKey(Item, event, ListBox) });
            TextBox.addEvent('focus', function (event) { OnTextFocus(Item, event, ListBox) });
            TextBox.addEvent('blur', function (event) { OnTextBlur(Item, event, ListBox) });

            Item.appendChild(TextBox);

        }
        else {      // assume type is "tangle"
            // var itemId = 'tangle'+this.GetTotalItems();     // first item is tangle0
            var tangleBox = new Element('span', {
                id: 'listItem',
                tabindex: '0',          // to allow it to get keyboard focus
                class: 'TKAdjustableNumber',
                'data-var': 'listItem',    // fixed, because each item has its own tangle
                'data-min': RangeMin,
                'data-max': RangeMax,
                'data-step': RangeStep
            });
            Item.appendChild(tangleBox);

            var tangle = new Tangle(Item,
               {
                   initialize: function () { this.listItem = (_Value == "") ? InitialValue : _Value },
                   update: function () { sendParmsToSqueak() }
               });

            var insertionIndex = (prevSibling == null) ? 0 : indexOfItem(prevSibling)+1;
            Tangles.splice(insertionIndex, 0, tangle);

            //Register events
            tangleBox.addEvent('keydown', function (event) { OnTangleKey(Item, event, ListBox) });
        }

        if (prevSibling) { Item.inject(prevSibling, 'after') }   // mootools - add as next sibling
        else { ListBoxDiv.appendChild(Item) }
    }

    // private method indexOfItem
    var indexOfItem = function (item) {
        var allItems = ListBoxDiv.childNodes;

        for (var n = 0; n < allItems.length; ++n) {
            if (allItems[n] === item) return n;
        }
        return null;
    }


    // private method textForItem
    var textForItem = function (item) {
        if (ItemType == "tangle") { return "" };

        listItem = item.getElementById('listItem');
        return listItem.innerHTML;
    }

    // private method valueForItem
    var valueForItem = function (item) {
        if (ItemType == "tangle") {
            var index = indexOfItem(item);
            var tangle = Tangles[index];
            return tangle.getValue("listItem");
        }

        listItem = item.getElementById('listItem');
        return listItem.value;
    }

    // private method nextAvailableColour
    var nextAvailableColour = function () {
        var colourIndices = new Array();
        colourIndices.length = Colours.length;
        var allItems = ListBoxDiv.childNodes;
        for (var n = 0; n < allItems.length; ++n) {
            var usedColour = allItems[n].checkboxColour;
            if (usedColour!=null) colourIndices[usedColour] = true;
        }

        for (var i = 0; i < colourIndices.length; i++) {
            if (colourIndices[i] != true) return i;
        }
        alert('Run out of colours');
        return null;
    }

    //Public method GetActiveItems
    // returns an array of the items whose checkboxes are ticked.
    // for each item provide:  Text, Value, ColourIndex
      this.GetActiveItems = function () {
          var activeItems = new Array();
          var allItems = ListBoxDiv.childNodes;
          var item = null;

          for (var n = 0; n < allItems.length; ++n) {
              item = allItems[n];
              if (item.getElementById('checkbox').checked) {
                  activeItems.push({ Text: textForItem(item), Value: valueForItem(item), ColourIndex: item.checkboxColour });
              }
          }
          return activeItems;
      }

      // public method AcceptFocus
      this.AcceptFocus = function (index) {
          var newFocus = ListBoxDiv.childNodes[index].getElementById('listItem');
          newFocus.value = newFocus.value;      // sets the selection to the end
          newFocus.focus();
      }

      // public method ShadowSelectItem
      this.ShadowSelectItem = function (index) {
          if (ItemType == "tangle") return;

          if (SelectedIndex != null) {
              item = ListBoxDiv.childNodes[SelectedIndex];
              item.style.backgroundColor = NormalItemBackColor;
              item.getElementById('listItem').style.backgroundColor = NormalItemBackColor;
              //item.style.fontWeight = 'normal';
              SelectedIndex = null;
          }

          if (index != null) {
              item = ListBoxDiv.childNodes[index];
              if (item) {
                  item.style.backgroundColor = SelectedItemBackColor;
                  item.getElementById('listItem').style.backgroundColor = SelectedItemBackColor;
                  //item.style.fontWeight = 'bold';
                  SelectedIndex = index;
              }
          }
      }

    // public method ShadowCheckBox
    this.ShadowCheckBox = function (index, checked) {
        var item = ListBoxDiv.childNodes[index];
        item.getElementById('checkbox').checked = checked;
        setCheckboxColour(item);
    }

    // public method ShadowAddItem
    // create an item as a copy of, and immediately after, the item at the supplied index
    this.ShadowAddItem = function (baseIndex) {
        var oldItem = ListBoxDiv.childNodes[baseIndex];
        var value = valueForItem(oldItem);
        var text = value;
        this.addItem(text, value, oldItem);
        }

    //Public method Dispose.
    this.Dispose = function () {
        while (EventHandlers.length > 0)
            DetachEventHandler(EventHandlers.pop());

        Base.removeChild(ListBoxDiv);
    }

    //Public method Contains.
    this.Contains = function (Index) {
        return typeof (Index) == 'number' && ListBoxDiv.childNodes[Index] ? true : false;
    }

    //Public method GetItem.
    this.GetItem = function (Index) {
        var Divs = ListBoxDiv.getElementsByTagName('div');

        return this.Contains(Index) ? { IsSelected: Divs[Index].childNodes[0].checked, Text: Divs[Index].childNodes[1].innerHTML, Value: Divs[Index].childNodes[1].value, ItemIndex: Index} : null;
    }

    //Public method DeleteItem.
    this.DeleteItem = function (Index) {
        if (!this.Contains(Index)) return false;

        try {
            ListBoxDiv.removeChild(ListBoxDiv.childNodes[Index]);
        }
        catch (err) {
            return false;
        }

        return true;
    }

    //Public method DeleteItems.
    this.DeleteItems = function () {
        var ItemsRemoved = 0;

        for (var n = ListBoxDiv.childNodes.length - 1; n >= 0; --n)
            try {
                ListBoxDiv.removeChild(ListBoxDiv.childNodes[n]);
                ItemsRemoved++;
            }
            catch (err) {
                break;
            }

        return ItemsRemoved;
    }

    //Public method GetTotalItems.
    this.GetTotalItems = function () {
        return ListBoxDiv.childNodes.length;
    }

    //Item keystroke event handler.
    var OnTextKey = function (item, event, listBox) {
        // the passed event parameter is already an instance of the Event type.
        var index = indexOfItem(item);
        var listItem = item.getElementById('listItem');

        if (event.key == 'enter') {
            if (event.shift) {
                // create new item with contents from text box
                var value = listItem.value;
                var text = value;
                var newItem = listBox.addItem(text, value, item);

                // also add in the other lists
                ListsToSync.forEach(function (each) {
                    each.ShadowAddItem(index);
                    each.ShadowSelectItem(index + 1);
                });

                // select text box (but not check box) of new item
                newItem.getElementById('listItem').focus();
                listBox.SelectionInitialText = "";         // an empty item
            } else {
                // record the updated contents, for when focus eventually switches
                listBox.SelectionInitialText = item.getElementById('listItem').value;
            }

            // (whether or not shift was pressed)
            // ensure check box of current item (here and in shadows) is set
            // tell client that the list has changed
            if (!item.getElementById('checkbox').checked) {
                item.getElementById('checkbox').checked = true;
                setCheckboxColour(item);
                ListsToSync.forEach(function (each) { each.ShadowCheckBox(index, true) });
            }
            SelectionsChangedHandler(listBox);
            event.preventDefault();
        }
        else if (event.key == 'up' || event.key == 'down') {
            delta = (event.key == 'up') ? -1 : 1;
            var targetIndex = index + delta;
            if (targetIndex >= 0 && targetIndex < listBox.GetTotalItems()) {
                var newFocus = ListBoxDiv.childNodes[targetIndex].getElementById('listItem');
                if (event.shift) {
                    newFocus.value = listItem.value;
                    SelectionsChangedHandler(listBox);
                } else {
                    newFocus.value = newFocus.value;      // sets the selection to the end
                }
                newFocus.focus();
                event.preventDefault();
            }
        }
        else if (event.key == 'tab') {
            if (ListsToSync.length != 0) {
                var focusListIndex = (event.shift) ? ListsToSync.length-1 : 0;
                ListsToSync[focusListIndex].AcceptFocus(index);
            }
            event.preventDefault();
        }

    }

    //Item focus event handler.
    var OnTextFocus = function (item, event, listBox) {
        var index = indexOfItem(item);
        listBox.ShadowSelectItem(null);        // clear any shadow selection
        listBox.SelectionInitialText = item.getElementById('listItem').value;
        ListsToSync.forEach(function (each) { each.ShadowSelectItem(index) });
    }

    //Item focus-loss event handler.
    var OnTextBlur = function (item, event, listBox) {
        ListsToSync.forEach(function (each) { each.ShadowSelectItem(null) });
        if (listBox.SelectionInitialText != item.getElementById('listItem').value) {
            listBox.SelectionInitialText = "was: " + listBox.SelectionInitialText + " now: " + item.getElementById('listItem').value;
            SelectionsChangedHandler(listBox);
        }
        listBox.SelectionInitialText = null;
    }

    //Item mouseover event handler.
    var OnMouseOver = function (CheckBox, Item) {
        if (CheckBox.checked) return;
        /*				
        // save existing values of colours, to be restored when mouse moves away
        Item.bgColor = Item.style.backgroundColor;
        Item.fColor = Item.style.color;
        Item.bColor = Item.style.borderTopColor;

        Item.style.backgroundColor = HoverItemBackColor;
        Item.style.color = HoverItemColor;
        Item.style.borderTopColor = Item.style.borderBottomColor = HoverBorderdColor;
        Item.style.fontWeight = 'bold';
        */
    }


    //Item mouseout event handler.
    var OnMouseOut = function (CheckBox, Item) {
        if (CheckBox.checked) return;

        /*
        // restore saved colours
        Item.style.backgroundColor = Item.bgColor;
        Item.style.color = Item.fColor;
        Item.style.borderTopColor = Item.style.borderBottomColor = Item.bColor;
        Item.style.fontWeight = 'normal';
        */
    }

    //CheckBox click event handler.
    var OnCheckboxClick = function (item, event, listBox) {
        // the passed event parameter is already an instance of the Event type.
        var checkbox = item.getElementById('checkbox');
        var checked = checkbox.checked;
        var index = indexOfItem(item);

        ListsToSync.forEach(function (each) { each.ShadowCheckBox(index, checked) });
        setCheckboxColour(item);
        SelectionsChangedHandler(listBox);
    }


    // Tangle keystroke event handler.
    var OnTangleKey = function (item, event, listBox) {
        // the passed event parameter is already an instance of the Event type.
        event.preventDefault();
        if (event.key == 'space') {
            var index = indexOfItem(item);
            var listItem = item.getElementById('listItem');

            // create new item with contents from text box
            var value = valueForItem(item);
            listBox.addItem(value, value, item);

            // also add in the other lists
            ListsToSync.forEach(function (each) {
                each.ShadowAddItem(index);
                each.ShadowSelectItem(index + 1);
            });

            // (whether or not shift was pressed)
            // ensure check box of current item (here and in shadows) is set
            // tell client that the list has changed
            if (!item.getElementById('checkbox').checked) {
                item.getElementById('checkbox').checked = true;
                setCheckboxColour(item);
                ListsToSync.forEach(function (each) { each.ShadowCheckBox(index, true) });
            }
            SelectionsChangedHandler(listBox);
        };
    }

    var setCheckboxColour = function (item) {
        var cbSpan = item.getElementById('cbSpan');
        var checkbox = cbSpan.getElementById('checkbox');
        var checked = checkbox.checked;

        if (checked) {
            var colourIndex = item.checkboxColour;
            if (colourIndex == null) {
                colourIndex = nextAvailableColour();
                item.checkboxColour = colourIndex;
            }
            var colour = Colours[colourIndex];
            cbSpan.style.backgroundColor = cbSpan.style.borderTopColor = cbSpan.style.borderBottomColor = colour;
        }
        else {
            cbSpan.style.backgroundColor = cbSpan.style.borderTopColor = cbSpan.style.borderBottomColor = NormalItemBackColor;
        }
    }


    Base.appendChild(ListBoxDiv);
    this.addItem("","",null);
}


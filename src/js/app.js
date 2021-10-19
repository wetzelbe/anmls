App = {
  web3Provider: null,
  contracts: {},
  account: null,
  imagepath: "/api/v1/image/",
  tokensofUser: [],
  buyableTokens: [],
  Pages: {
    current: "Home",
    hideAll: function () {
      $('.container-youngest').addClass("d-none");
      $('.container-user').addClass("d-none");
      $('.container-breed').addClass("d-none");
      $('.container-breed-error').addClass("d-none");
      $('.container-marketplace').addClass("d-none");
      $('.container-sell').addClass('d-none');
    },
    reload: function () {
      App.Pages[App.Pages.current].init()
    },
    Home: {
      init: function () {
        App.Pages.current = "Home";
        App.Pages.hideAll();
        $('.container-youngest').removeClass("d-none");
        var latestAnimals = $('#latestAnimals');
        latestAnimals.empty();
        App.Pages.Home.showYoungest();
      },
      show: function () {
        App.Pages.hideAll();
        $('.container-youngest').removeClass("d-none");
      },
      showYoungest: function (offset = 0) {
        let baseInstance;
        let tokenId;
        var latestAnimals = $('#latestAnimals');
        var panelTemplate = $('#animalTemplate');
        App.contracts.Base.deployed().then(function (instance) {
          baseInstance = instance;

          return baseInstance.last.call();
        }).then(function (x) {
          console.log("There are " + x + " Tokens");
          tokenId = x.toString() - offset;
          if (tokenId > 0) {
            return baseInstance.nameOf.call(tokenId);
          }
          throw "Not enough animals to show";
        }).then(function (x) {
          panelTemplate.find('.card-title').text(x);
          panelTemplate.find('.tokenID').text("0x" + tokenId.toString(16).toUpperCase())
          return baseInstance.parent1Of.call(tokenId);
        }).then(function (x) {
          panelTemplate.find('.animal-parent1').text("0x" + x.toString(16).toUpperCase());

          return baseInstance.parent2Of.call(tokenId);
        }).then(function (x) {
          panelTemplate.find('.animal-parent2').text("0x" + x.toString(16).toUpperCase());

          return baseInstance.ownerOf.call(tokenId);
        }).then(function (x) {
          panelTemplate.find('.animal-owner').text(App.shorten(x));

          return baseInstance.genesOf.call(tokenId);
        }).then(function (x) {
          panelTemplate.find('.animal-genes').text("0x" + x.toString(16).toUpperCase());
          panelTemplate.find('.img-center').attr('src', App.imagepath + "0x" + x.toString(16).toUpperCase());
          latestAnimals.append(panelTemplate.html());
          if (offset < 3)
            App.Pages.Home.showYoungest(offset + 1)
        }).catch(function (err) {
          console.log(err.message);
        });
      }
    },
    Breed: {
      init: function () {
        App.Pages.current = "Breed";
        App.Pages.Breed.breed();
      },
      show: function () {
        App.Pages.Breed.init();
      },
      breed: function () {
        let baseInstance;
        App.contracts.Base.deployed().then(function (instance) {
          baseInstance = instance;

          return baseInstance.balanceOf.call(App.account);
        }).then(function (x) {
          console.log("User has " + x + " Tokens");
          if (x < 2) {
            App.Pages.hideAll();
            $('.container-breed-error').removeClass("d-none");
            throw "Not enough animals to breed!";
          }
          else {
            $('.container-breed-error').addClass("d-none");
            App.getTokenIds(baseInstance, App.account, 0, x - 1, baseInstance.tokenOfOwnerByIndex.call(App.account, 0), App.Pages.Breed.addTokensOfOwnerToSelect)
            App.Pages.hideAll();
            $('.container-breed').removeClass("d-none");
            $('#child').find('.animal-owner').text(App.shorten(App.account))
          }
        }).catch(function (err) {
          console.log(err.message);
        });
      },

      UpdateParentCard: function (parentfilter) {
        let parent = $(parentfilter);
        let baseInstance;
        App.contracts.Base.deployed().then(function (instance) {
          baseInstance = instance;
          return baseInstance.nameOf.call(parent.find('select')[0].value);
        }).then(function (x) {
          parent.find('.name').text(x);
          return baseInstance.genesOf.call(parent.find('select')[0].value);
        }).then(function (x) {
          parent.find('.animal-genes').text("0x" + x.toString(16).toUpperCase());
          parent.find('.img-center').attr('src', App.imagepath + "0x" + x.toString(16).toUpperCase());

          return baseInstance.parent1Of.call(parent.find('select')[0].value);
        }).then(function (x) {
          parent.find('.animal-parent1').text("0x" + x.toString(16).toUpperCase())

          return baseInstance.parent2Of.call(parent.find('select')[0].value);
        }).then(function (x) {
          parent.find('.animal-parent2').text("0x" + x.toString(16).toUpperCase())

        }).catch(function (err) {
          console.log(err.message);
        });
      },

      addTokensOfOwnerToSelect: function () {
        let parent1 = $('#parent1');
        let parent2 = $('#parent2');
        $('#choose-token-parent1 option').remove()
        $('#choose-token-parent2 option').remove()
        for (let i = 0; i < App.tokensofUser.length; i++) {
          var opt = document.createElement('option')
          opt.value = "0x" + App.tokensofUser[i].toString(16).toUpperCase()
          opt.innerHTML = "0x" + App.tokensofUser[i].toString(16).toUpperCase()
          parent1.find('#choose-token-parent1').append(opt)
          parent2.find('#choose-token-parent2').append(opt.cloneNode(true))
        }
        App.Pages.Breed.UpdateParentCard('#parent1');
        App.Pages.Breed.UpdateParentCard('#parent2');
      },

      confirmBreeding: function () {
        let baseInstance;
        App.contracts.Base.deployed().then(function (instance) {
          baseInstance = instance;
          return baseInstance.breed.sendTransaction($('#parent1 select')[0].value,
            $('#parent2 select')[0].value,
            $('#child input')[0].value, { from: App.account });
        }).catch(function (err) {
          console.log(err.message);
        });

        App.Pages.Home.init();
        $('#confirmbreedingmodal').modal('hide');
      },
    },
    User: {
      init: function () {
        App.Pages.current = "User";
        App.Pages.hideAll();
        $('.container-user').removeClass("d-none");
        App.Pages.User.load();
      },
      show: function () {
        App.Pages.hideAll();
        $('.container-user').removeClass("d-none");
      },

      load: function () {
        let usersAnimals = $('#users-animals');
        usersAnimals.empty();
        let baseInstance;
        App.contracts.Base.deployed().then((instance) => {
          baseInstance = instance;
          return baseInstance.balanceOf.call(App.account);
        }).then(function (x) {
          console.log("User has " + x + " Tokens");
          if (x < 1) {
            $('#no-animal-message').removeClass("d-none");
          }
          else {
            $('#no-animal-message').addClass("d-none");
            App.getTokenIds(baseInstance, App.account, 0, x - 1, baseInstance.tokenOfOwnerByIndex.call(App.account, 0), App.Pages.User.showAnimals)
          }
        }).catch(function (err) {
          console.log(err.message);
        });
      },
      showAnimals: function (baseInstance, n, max) {
        if (baseInstance == undefined) {
          App.contracts.Base.deployed().then((instance) => {
            App.Pages.User.showAnimals(instance, 0, App.tokensofUser.length - 1);
          })
        }
        else {
          let name;
          let genes;
          let parent1;
          let parent2;
          let tokenId = App.tokensofUser[n].toString()
          baseInstance.nameOf.call(tokenId).then(function (x) {
            name = x;
            return baseInstance.genesOf.call(tokenId);
          }).then(function (x) {
            genes = x;
            return baseInstance.parent1Of.call(tokenId);
          }).then(function (x) {
            parent1 = x;
            return baseInstance.parent2Of.call(tokenId);
          }).then(function (x) {
            parent2 = x;
            let usersAnimals = $('#users-animals');
            let template = $('#animalTemplate');
            template.find('.animal-genes').text("0x" + genes.toString(16).toUpperCase());
            template.find('.card-title').text(name);
            template.find('.animal-parent1').text("0x" + parent1.toString(16).toUpperCase());
            template.find('.animal-parent2').text("0x" + parent2.toString(16).toUpperCase());
            template.find('.animal-owner').text(App.shorten(App.account));
            template.find('.img-center').attr('src', App.imagepath + "0x" + genes.toString(16).toUpperCase());


            usersAnimals.append(template.html());

            if (n < max) {
              App.Pages.User.showAnimals(baseInstance, n + 1, max);
            }
          })/*.catch(function (err) {
            console.log(err.message);
          });*/
        }


      }
    },
    Marketplace: {
      init: function () {
        App.Pages.current = "Marketplace";
        App.Pages.hideAll();
        $('.container-marketplace').removeClass("d-none")
        App.Pages.Marketplace.load();
      },
      load: function () {
        let buyableAnimals = $('#buyable-animals');
        buyableAnimals.empty();
        App.getBuyableTokenIds(undefined, undefined, undefined, App.Pages.Marketplace.showAnimals);
      },
      showAnimals: function (baseInstance, n, max) {

        if (App.buyableTokens.length == 0) {
          $('#no-animal-for-sale-message').removeClass("d-none")
          return;
        }
        $('#no-animal-for-sale-message').addClass("d-none")
        if (baseInstance == undefined) {
          App.contracts.Base.deployed().then((instance) => {
            App.Pages.Marketplace.showAnimals(instance, 0, App.buyableTokens.length - 1);
          })
        }
        else {
          let name;
          let genes;
          let parent1;
          let parent2;
          let tokenId = App.buyableTokens[n].toString();
          let owner;
          let price;
          baseInstance.nameOf.call(tokenId).then(function (x) {
            name = x;
            return baseInstance.genesOf.call(tokenId);
          }).then(function (x) {
            genes = x;
            return baseInstance.parent1Of.call(tokenId);
          }).then(function (x) {
            parent1 = x;
            return baseInstance.parent2Of.call(tokenId);
          }).then(function (x) {
            parent2 = x;
            return baseInstance.ownerOf.call(tokenId);
          }).then(function (x) {
            owner = x;
            return baseInstance.priceOf.call(tokenId);
          }).then(function (x) {
            price = x;
            let buyableAnimals = $('#buyable-animals');
            let template = $('#marketplaceTemplate');
            template.find('.animal-genes').text("0x" + genes.toString(16).toUpperCase());
            template.find('.card-title').text(name);
            template.find('.animal-parent1').text("0x" + parent1.toString(16).toUpperCase());
            template.find('.animal-parent2').text("0x" + parent2.toString(16).toUpperCase());
            template.find('.animal-owner').text(App.shorten(owner));
            template.find('.animal-price').text(BigInt(price) / BigInt("1000000000000000000") + " ETH");
            template.find('.tokenID').text("0x" + tokenId.toString(16).toUpperCase());
            template.find('.img-center').attr('src', App.imagepath + "0x" + genes.toString(16).toUpperCase());
            template.find('.animal-buy').attr('onclick', "App.Pages.Marketplace.buy(" + tokenId + "," + price + ")");
            if (App.account !== null)
              template.find('.animal-buy').removeClass("d-none");

            buyableAnimals.append(template.html());

            if (n < max) {
              App.Pages.Marketplace.showAnimals(baseInstance, n + 1, max);
            }
          }).catch(function (err) {
            console.log(err.message);
          });
        }


      },
      buy: function (tokenId, price) {
        console.log("Buying " + tokenId);
        $('#confirmpurchasemodal').find('.price').text(price)
        $('#confirmpurchasemodal').find('.tokenId').text(tokenId)
        $('#confirmpurchasemodal').modal('show')
      },
      confirm: function () {
        let baseInstance;
        App.contracts.Base.deployed().then(function (instance) {
          baseInstance = instance;
          return baseInstance.buy.sendTransaction($('#confirmpurchasemodal').find('.tokenId').text(),
            {
              from: App.account,
              value: $('#confirmpurchasemodal').find('.price').text()
            });
        }).catch(function (err) {
          console.log(err.message);
        });

        App.Pages.Home.init();
        $('#confirmpurchasemodal').modal('hide');
      }


    },
    Sell: {
      init: function () {
        let baseInstance;
        App.contracts.Base.deployed().then(function (instance) {
          baseInstance = instance;

          return baseInstance.balanceOf.call(App.account);
        }).then(function (x) {
          console.log("User has " + x + " Tokens");
          if (x < 1) {
            $('.container-sell-error').removeClass("d-none");
            $(document).find('.btn-sell-animal')[0].disabled = true;
          }
          else {
            $('.container-sell-error').addClass("d-none");
            $(document).find('.btn-sell-animal')[0].disabled = false;
            App.getTokenIds(baseInstance, App.account, 0, x - 1, baseInstance.tokenOfOwnerByIndex.call(App.account, 0), App.Pages.Sell.addTokensOfOwnerToSelect)
          }
          App.Pages.current = 'Sell';
          App.Pages.hideAll();
          $('.container-sell').removeClass('d-none')
        }).catch(function (err) {
          console.log(err.message);
        });
      },
      addTokensOfOwnerToSelect: function () {
        let select = $('#animal-select');
        $('#animal-select option').remove()
        for (let i = 0; i < App.tokensofUser.length; i++) {
          var opt = document.createElement('option')
          opt.value = "0x" + App.tokensofUser[i].toString(16).toUpperCase()
          opt.innerHTML = "0x" + App.tokensofUser[i].toString(16).toUpperCase()
          select.append(opt)
        }
      },
      askforconfirm: function () {
        $('#confirmsellmodal').modal('show')
        let price = $('#price-input')[0].value;
        let tokenId = $('#animal-select')[0].value;
        let modal = $('#confirmsellmodal')
        modal.find('.price').text(price)
        modal.find('.tokenId').text(tokenId)
      },

      confirm: function () {
        let modal = $('#confirmsellmodal');
        App.Pages.Home.init();
        modal.modal('hide')
        let baseInstance;
        App.contracts.Base.deployed().then(function (instance) {
          baseInstance = instance;
          let token = modal.find('.tokenId');
          let price = modal.find('.price');
          return baseInstance.sell.sendTransaction(token[0].innerHTML, price[0].innerHTML, { from: App.account });
        }).catch(function (err) {
          console.log(err.message);
        });
      }
    }

  },
  init: async function () {
    return App.initWeb3();

  },

  initWeb3: function () {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
    }
    App.initContract();
  },


  initContract: function () {
    $.getJSON('Base.json', function (data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var ContractArtifact = data;
      App.contracts.Base = TruffleContract(ContractArtifact);

      // Set the provider for our contract
      App.contracts.Base.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted pets

      App.bindEvents();
      return App.Pages.Home.init();
    });
  },

  bindEvents: function () {
    $(document).on('click', '.btn-breed', () => { App.Pages.Breed.breed() })
    $(document).on('click', '.btn-sell', () => { App.Pages.Sell.init() })
    $(document).on('click', '.btn-connect-wallet', () => { App.initWallet() })
    $(document).on('click', '.btn-sell-animal', () => { App.Pages.Sell.askforconfirm() })
    $(document).on('click', '.btn-confirm-sell', () => { App.Pages.Sell.confirm() })
    $(document).on('click', '.btn-confirm-breeding', () => { App.Pages.Breed.confirmBreeding() })
    $(document).on('change', '#choose-token-parent1', () => { App.Pages.Breed.UpdateParentCard("#parent1") })
    $(document).on('change', '#choose-token-parent2', () => { App.Pages.Breed.UpdateParentCard("#parent2") })
    $(document).on('click', '.navbar-brand', () => { App.Pages.Home.init() })
    $(document).on('click', '.btn-marketplace', () => { App.Pages.Marketplace.init() })
    $(document).on('click', '.btn-confirm-purchase', () => { App.Pages.Marketplace.confirm() })
    $('#confirmbreedingmodal').on('show.bs.modal', function (event) {
      var modal = $(this)

      modal.find('.name').text($('#child input')[0].value);
      modal.find('.parents').text($('#parent1 select')[0].value + ", " + $('#parent2 select')[0].value);
      if ($('#parent1 select')[0].value == $('#parent2 select')[0].value) {
        modal.find('#error').removeClass('d-none')
        modal.find('.btn-confirm-breeding')[0].disabled = true

      }
      else {
        modal.find('#error').addClass('d-none')
        modal.find('.btn-confirm-breeding')[0].disabled = false
      }
    })
  },

  getTokenIds: function (instance, owner, n, max, ret, onDone) {
    if (n == 0)
      App.tokensofUser = [];
    ret.then(function (x) {
      App.tokensofUser.push(x)

      if (n < max) {
        App.getTokenIds(instance, owner, n + 1, max, instance.tokenOfOwnerByIndex.call(owner, n + 1), onDone)
      }
      else {
        onDone()
      }
    })
  },

  getBuyableTokenIds: function (instance, n, max, onDone) {
    if (instance == undefined) {
      App.buyableTokens = [];
      App.contracts.Base.deployed().then((base) => {
        instance = base;
        instance.buyableNumber.call().then(function (x) {
          if (x > 0) {
            App.getBuyableTokenIds(instance, 0, x - 1, onDone);
          }
          else {
            onDone();
          }
        })
      })
    }
    else {
      instance.buyableByIndex.call(n).then((x) => {
        App.buyableTokens.push(x);
        if (n < max) {
          App.getBuyableTokenIds(instance, n + 1, x, onDone);
        }
        else {
          onDone();
        }
      })

    }
  },

  initWallet: function () {
    if (window.ethereum) {
      // Request account access
      window.ethereum.enable().then(() => {
        App.initWallet2();
      }).catch((error) => {
        // User denied account access...
        console.error("User denied account access")
      })
    }
    else
      App.initWallet2();

  },

  initWallet2: function () {
    web3 = new Web3(App.web3Provider);
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      App.account = accounts[0];
      $(".btn-connect-wallet").html(App.shorten(App.account));
      $(".btn-connect-wallet").removeClass("btn-dark")
      $(".btn-connect-wallet").addClass("btn-success")
      $(document).off("click", ".btn-connect-wallet")
      $(".btn-breed").removeClass("d-none")
      $(".btn-sell").removeClass("d-none")
      $(document).on('click', '.btn-connect-wallet', () => { App.Pages.User.init() })
      App.Pages.reload();
    });

  },

  shorten: function (x) {
    if (x.length > 9)
      return x.substring(0, 5) + "..." + x.substring(x.length - 5, x.length - 1);
    else
      return x
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});

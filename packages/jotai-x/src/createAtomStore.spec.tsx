import '@testing-library/jest-dom';

import React from 'react';
import { act, queryByText, render, renderHook } from '@testing-library/react';
import { atom, PrimitiveAtom, useAtomValue } from 'jotai';
import { splitAtom } from 'jotai/utils';

import { createAtomStore } from './createAtomStore';

describe('createAtomStore', () => {
  describe('single provider', () => {
    type MyTestStoreValue = {
      name: string;
      age: number;
      becomeFriends: () => void;
    };

    const INITIAL_NAME = 'John';
    const INITIAL_AGE = 42;

    const initialTestStoreValue: MyTestStoreValue = {
      name: INITIAL_NAME,
      age: INITIAL_AGE,
      becomeFriends: () => {},
    };

    const { myTestStoreStore, useMyTestStoreStore, MyTestStoreProvider } =
      createAtomStore(initialTestStoreValue, { name: 'myTestStore' as const });

    const ReadOnlyConsumer = () => {
      const name = useMyTestStoreStore().useNameValue();
      const age = useMyTestStoreStore().useAgeValue();

      return (
        <div>
          <span>{name}</span>
          <span>{age}</span>
        </div>
      );
    };

    const ReadOnlyConsumerWithKeyParam = () => {
      const name = useMyTestStoreStore().useValue('name');
      const age = useMyTestStoreStore().useValue('age');

      return (
        <div>
          <span>{name}</span>
          <span>{age}</span>
        </div>
      );
    };

    const WRITE_ONLY_CONSUMER_AGE = 99;

    const WriteOnlyConsumer = () => {
      const setAge = useMyTestStoreStore().useSetAge();

      return (
        <button type="button" onClick={() => setAge(WRITE_ONLY_CONSUMER_AGE)}>
          consumerSetAge
        </button>
      );
    };

    const WriteOnlyConsumerWithKeyParam = () => {
      const setAge = useMyTestStoreStore().useSet('age');

      return (
        <button type="button" onClick={() => setAge(WRITE_ONLY_CONSUMER_AGE)}>
          consumerSetAge
        </button>
      );
    };

    const SubscribeConsumer = ({
      subName,
      subAge,
    }: {
      subName: (newName: string) => void;
      subAge: (newAge: number) => void;
    }) => {
      const store = useMyTestStoreStore();

      React.useEffect(() => {
        const unsubscribeName = store.subscribeName(subName);
        const unsubscribeAge = store.subscribeAge(subAge);
        return () => {
          unsubscribeName();
          unsubscribeAge();
        };
      }, [store, subName, subAge]);

      return null;
    };

    const SubscribeConsumerWithKeyParam = ({
      subName,
      subAge,
    }: {
      subName: (newName: string) => void;
      subAge: (newAge: number) => void;
    }) => {
      const store = useMyTestStoreStore();

      React.useEffect(() => {
        const unsubscribeName = store.subscribe('name', subName);
        const unsubscribeAge = store.subscribe('age', subAge);
        return () => {
          unsubscribeName();
          unsubscribeAge();
        };
      }, [store, subName, subAge]);

      return null;
    };

    const MUTABLE_PROVIDER_INITIAL_AGE = 19;
    const MUTABLE_PROVIDER_NEW_AGE = 20;

    const MutableProvider = ({ children }: { children: React.ReactNode }) => {
      const [age, setAge] = React.useState(MUTABLE_PROVIDER_INITIAL_AGE);

      return (
        <>
          <MyTestStoreProvider age={age}>{children}</MyTestStoreProvider>

          <button
            type="button"
            onClick={() => setAge(MUTABLE_PROVIDER_NEW_AGE)}
          >
            providerSetAge
          </button>
        </>
      );
    };

    const BecomeFriendsProvider = ({
      children,
    }: {
      children: React.ReactNode;
    }) => {
      const [becameFriends, setBecameFriends] = React.useState(false);

      return (
        <>
          <MyTestStoreProvider becomeFriends={() => setBecameFriends(true)}>
            {children}
          </MyTestStoreProvider>

          <div>becameFriends: {becameFriends.toString()}</div>
        </>
      );
    };

    const BecomeFriendsUseValue = () => {
      // Make sure both of these are actual functions, not wrapped functions
      const becomeFriends1 = useMyTestStoreStore().useBecomeFriendsValue();
      const becomeFriends2 = useMyTestStoreStore().useAtomValue(
        myTestStoreStore.atom.becomeFriends
      );

      return (
        <button
          type="button"
          onClick={() => {
            becomeFriends1();
            becomeFriends2();
          }}
        >
          Become Friends
        </button>
      );
    };

    const BecomeFriendsUseValueWithKeyParam = () => {
      const becomeFriends1 = useMyTestStoreStore().useValue('becomeFriends');
      const becomeFriends2 = useMyTestStoreStore().useAtomValue(
        myTestStoreStore.atom.becomeFriends
      );

      return (
        <button
          type="button"
          onClick={() => {
            becomeFriends1();
            becomeFriends2();
          }}
        >
          Become Friends
        </button>
      );
    };

    const BecomeFriendsGet = () => {
      // Make sure both of these are actual functions, not wrapped functions
      const store = useMyTestStoreStore();

      return (
        <button
          type="button"
          onClick={() => {
            store.getBecomeFriends()();
            store.getAtom(myTestStoreStore.atom.becomeFriends)();
          }}
        >
          Become Friends
        </button>
      );
    };

    const BecomeFriendsGetWithKeyParam = () => {
      const store = useMyTestStoreStore();

      return (
        <button
          type="button"
          onClick={() => {
            store.get('becomeFriends')();
            store.getAtom(myTestStoreStore.atom.becomeFriends)();
          }}
        >
          Become Friends
        </button>
      );
    };

    const BecomeFriendsUseSet = () => {
      const setBecomeFriends = useMyTestStoreStore().useSetBecomeFriends();
      const [becameFriends, setBecameFriends] = React.useState(false);

      return (
        <>
          <button
            type="button"
            onClick={() => setBecomeFriends(() => setBecameFriends(true))}
          >
            Change Callback
          </button>

          <div>useSetBecameFriends: {becameFriends.toString()}</div>
        </>
      );
    };

    const BecomeFriendsUseSetWithKeyParam = () => {
      const setBecomeFriends = useMyTestStoreStore().useSet('becomeFriends');
      const [becameFriends, setBecameFriends] = React.useState(false);

      return (
        <>
          <button
            type="button"
            onClick={() => setBecomeFriends(() => setBecameFriends(true))}
          >
            Change Callback
          </button>

          <div>useSetBecameFriends: {becameFriends.toString()}</div>
        </>
      );
    };

    const BecomeFriendsSet = () => {
      const store = useMyTestStoreStore();
      const [becameFriends, setBecameFriends] = React.useState(false);
      return (
        <>
          <button
            type="button"
            onClick={() => store.setBecomeFriends(() => setBecameFriends(true))}
          >
            Change Callback
          </button>

          <div>setBecameFriends: {becameFriends.toString()}</div>
        </>
      );
    };

    const BecomeFriendsSetWithKeyParam = () => {
      const store = useMyTestStoreStore();
      const [becameFriends, setBecameFriends] = React.useState(false);
      return (
        <>
          <button
            type="button"
            onClick={() =>
              store.set('becomeFriends', () => setBecameFriends(true))
            }
          >
            Change Callback
          </button>

          <div>setBecameFriends: {becameFriends.toString()}</div>
        </>
      );
    };

    const BecomeFriendsUseState = () => {
      const [, setBecomeFriends] =
        useMyTestStoreStore().useBecomeFriendsState();
      const [becameFriends, setBecameFriends] = React.useState(false);

      return (
        <>
          <button
            type="button"
            onClick={() => setBecomeFriends(() => setBecameFriends(true))}
          >
            Change Callback
          </button>

          <div>useBecameFriends: {becameFriends.toString()}</div>
        </>
      );
    };

    const BecomeFriendsUseStateWithKeyParam = () => {
      const [, setBecomeFriends] =
        useMyTestStoreStore().useState('becomeFriends');
      const [becameFriends, setBecameFriends] = React.useState(false);

      return (
        <>
          <button
            type="button"
            onClick={() => setBecomeFriends(() => setBecameFriends(true))}
          >
            Change Callback
          </button>

          <div>useBecameFriends: {becameFriends.toString()}</div>
        </>
      );
    };

    beforeEach(() => {
      renderHook(() => useMyTestStoreStore().useSetName()(INITIAL_NAME));
      renderHook(() => useMyTestStoreStore().useSetAge()(INITIAL_AGE));
    });

    it('passes default values from provider to consumer', () => {
      const { getByText } = render(
        <MyTestStoreProvider>
          <ReadOnlyConsumer />
        </MyTestStoreProvider>
      );

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(INITIAL_AGE)).toBeInTheDocument();
    });

    it('passes default values from provider to consumer with key param', () => {
      const { getByText } = render(
        <MyTestStoreProvider>
          <ReadOnlyConsumerWithKeyParam />
        </MyTestStoreProvider>
      );

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(INITIAL_AGE)).toBeInTheDocument();
    });

    it('passes non-default values from provider to consumer', () => {
      const { getByText } = render(
        <MyTestStoreProvider name="Jane" age={94}>
          <ReadOnlyConsumer />
        </MyTestStoreProvider>
      );

      expect(getByText('Jane')).toBeInTheDocument();
      expect(getByText('94')).toBeInTheDocument();
    });

    it('passes non-default values from provider to consumer with key param', () => {
      const { getByText } = render(
        <MyTestStoreProvider name="Jane" age={94}>
          <ReadOnlyConsumerWithKeyParam />
        </MyTestStoreProvider>
      );

      expect(getByText('Jane')).toBeInTheDocument();
      expect(getByText('94')).toBeInTheDocument();
    });

    it('propagates updates from provider to consumer', () => {
      const { getByText } = render(
        <MutableProvider>
          <ReadOnlyConsumer />
        </MutableProvider>
      );

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(MUTABLE_PROVIDER_INITIAL_AGE)).toBeInTheDocument();

      act(() => getByText('providerSetAge').click());

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(MUTABLE_PROVIDER_NEW_AGE)).toBeInTheDocument();
    });

    it('propagates updates from provider to consumer with key param', () => {
      const { getByText } = render(
        <MutableProvider>
          <ReadOnlyConsumerWithKeyParam />
        </MutableProvider>
      );

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(MUTABLE_PROVIDER_INITIAL_AGE)).toBeInTheDocument();

      act(() => getByText('providerSetAge').click());

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(MUTABLE_PROVIDER_NEW_AGE)).toBeInTheDocument();
    });

    it('propagates updates between consumers', () => {
      const { getByText } = render(
        <MyTestStoreProvider>
          <ReadOnlyConsumer />
          <WriteOnlyConsumer />
        </MyTestStoreProvider>
      );

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(INITIAL_AGE)).toBeInTheDocument();

      act(() => getByText('consumerSetAge').click());

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(WRITE_ONLY_CONSUMER_AGE)).toBeInTheDocument();
    });

    it('propagates updates between consumers with key param', () => {
      const { getByText } = render(
        <MyTestStoreProvider>
          <ReadOnlyConsumerWithKeyParam />
          <WriteOnlyConsumerWithKeyParam />
        </MyTestStoreProvider>
      );

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(INITIAL_AGE)).toBeInTheDocument();

      act(() => getByText('consumerSetAge').click());

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(WRITE_ONLY_CONSUMER_AGE)).toBeInTheDocument();
    });

    it('prefers the most recent update', () => {
      const { getByText } = render(
        <MutableProvider>
          <ReadOnlyConsumer />
          <WriteOnlyConsumer />
        </MutableProvider>
      );

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(MUTABLE_PROVIDER_INITIAL_AGE)).toBeInTheDocument();

      act(() => getByText('consumerSetAge').click());

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(WRITE_ONLY_CONSUMER_AGE)).toBeInTheDocument();

      act(() => getByText('providerSetAge').click());

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(MUTABLE_PROVIDER_NEW_AGE)).toBeInTheDocument();

      act(() => getByText('consumerSetAge').click());

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(WRITE_ONLY_CONSUMER_AGE)).toBeInTheDocument();
    });

    it('prefers the most recent update with key param', () => {
      const { getByText } = render(
        <MutableProvider>
          <ReadOnlyConsumerWithKeyParam />
          <WriteOnlyConsumerWithKeyParam />
        </MutableProvider>
      );

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(MUTABLE_PROVIDER_INITIAL_AGE)).toBeInTheDocument();

      act(() => getByText('consumerSetAge').click());

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(WRITE_ONLY_CONSUMER_AGE)).toBeInTheDocument();

      act(() => getByText('providerSetAge').click());

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(MUTABLE_PROVIDER_NEW_AGE)).toBeInTheDocument();

      act(() => getByText('consumerSetAge').click());

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(WRITE_ONLY_CONSUMER_AGE)).toBeInTheDocument();
    });

    it('can subscribe', () => {
      const subName = jest.fn();
      const subAge = jest.fn();
      const { getByText } = render(
        <MutableProvider>
          <SubscribeConsumer subName={subName} subAge={subAge} />
          <WriteOnlyConsumer />
        </MutableProvider>
      );

      expect(subName).toHaveBeenCalledTimes(0);
      expect(subAge).toHaveBeenCalledTimes(0);

      act(() => getByText('consumerSetAge').click());

      expect(subName).toHaveBeenCalledTimes(0);
      expect(subAge).toHaveBeenNthCalledWith(1, WRITE_ONLY_CONSUMER_AGE);

      act(() => getByText('providerSetAge').click());

      expect(subName).toHaveBeenCalledTimes(0);
      expect(subAge).toHaveBeenNthCalledWith(2, MUTABLE_PROVIDER_NEW_AGE);

      act(() => getByText('consumerSetAge').click());

      expect(subName).toHaveBeenCalledTimes(0);
      expect(subAge).toHaveBeenNthCalledWith(3, WRITE_ONLY_CONSUMER_AGE);
    });

    it('can subscribe with key param', () => {
      const subName = jest.fn();
      const subAge = jest.fn();
      const { getByText } = render(
        <MutableProvider>
          <SubscribeConsumerWithKeyParam subName={subName} subAge={subAge} />
          <WriteOnlyConsumerWithKeyParam />
        </MutableProvider>
      );

      expect(subName).toHaveBeenCalledTimes(0);
      expect(subAge).toHaveBeenCalledTimes(0);

      act(() => getByText('consumerSetAge').click());

      expect(subName).toHaveBeenCalledTimes(0);
      expect(subAge).toHaveBeenNthCalledWith(1, WRITE_ONLY_CONSUMER_AGE);

      act(() => getByText('providerSetAge').click());

      expect(subName).toHaveBeenCalledTimes(0);
      expect(subAge).toHaveBeenNthCalledWith(2, MUTABLE_PROVIDER_NEW_AGE);

      act(() => getByText('consumerSetAge').click());

      expect(subName).toHaveBeenCalledTimes(0);
      expect(subAge).toHaveBeenNthCalledWith(3, WRITE_ONLY_CONSUMER_AGE);
    });

    it('provides and useValue of functions', () => {
      const { getByText } = render(
        <BecomeFriendsProvider>
          <BecomeFriendsUseValue />
        </BecomeFriendsProvider>
      );

      expect(getByText('becameFriends: false')).toBeInTheDocument();
      act(() => getByText('Become Friends').click());
      expect(getByText('becameFriends: true')).toBeInTheDocument();
    });

    it('provides and useValue of functions with key param', () => {
      const { getByText } = render(
        <BecomeFriendsProvider>
          <BecomeFriendsUseValueWithKeyParam />
        </BecomeFriendsProvider>
      );

      expect(getByText('becameFriends: false')).toBeInTheDocument();
      act(() => getByText('Become Friends').click());
      expect(getByText('becameFriends: true')).toBeInTheDocument();
    });

    it('provides and get functions', () => {
      const { getByText } = render(
        <BecomeFriendsProvider>
          <BecomeFriendsGet />
        </BecomeFriendsProvider>
      );

      expect(getByText('becameFriends: false')).toBeInTheDocument();
      act(() => getByText('Become Friends').click());
      expect(getByText('becameFriends: true')).toBeInTheDocument();
    });

    it('provides and get functions with key param', () => {
      const { getByText } = render(
        <BecomeFriendsProvider>
          <BecomeFriendsGetWithKeyParam />
        </BecomeFriendsProvider>
      );

      expect(getByText('becameFriends: false')).toBeInTheDocument();
      act(() => getByText('Become Friends').click());
      expect(getByText('becameFriends: true')).toBeInTheDocument();
    });

    it('useSet of functions', () => {
      const { getByText } = render(
        <BecomeFriendsProvider>
          <BecomeFriendsUseSet />
          <BecomeFriendsUseValue />
        </BecomeFriendsProvider>
      );

      act(() => getByText('Change Callback').click());
      expect(getByText('useSetBecameFriends: false')).toBeInTheDocument();
      act(() => getByText('Become Friends').click());
      expect(getByText('useSetBecameFriends: true')).toBeInTheDocument();
    });

    it('useSet of functions with key param', () => {
      const { getByText } = render(
        <BecomeFriendsProvider>
          <BecomeFriendsUseSetWithKeyParam />
          <BecomeFriendsUseValueWithKeyParam />
        </BecomeFriendsProvider>
      );

      act(() => getByText('Change Callback').click());
      expect(getByText('useSetBecameFriends: false')).toBeInTheDocument();
      act(() => getByText('Become Friends').click());
      expect(getByText('useSetBecameFriends: true')).toBeInTheDocument();
    });

    it('set of functions', () => {
      const { getByText } = render(
        <BecomeFriendsProvider>
          <BecomeFriendsSet />
          <BecomeFriendsUseValue />
        </BecomeFriendsProvider>
      );

      act(() => getByText('Change Callback').click());
      expect(getByText('setBecameFriends: false')).toBeInTheDocument();
      act(() => getByText('Become Friends').click());
      expect(getByText('setBecameFriends: true')).toBeInTheDocument();
    });

    it('set of functions with key param', () => {
      const { getByText } = render(
        <BecomeFriendsProvider>
          <BecomeFriendsSetWithKeyParam />
          <BecomeFriendsUseValueWithKeyParam />
        </BecomeFriendsProvider>
      );

      act(() => getByText('Change Callback').click());
      expect(getByText('setBecameFriends: false')).toBeInTheDocument();
      act(() => getByText('Become Friends').click());
      expect(getByText('setBecameFriends: true')).toBeInTheDocument();
    });

    it('use state functions', () => {
      const { getByText } = render(
        <BecomeFriendsProvider>
          <BecomeFriendsUseState />
          <BecomeFriendsUseValue />
        </BecomeFriendsProvider>
      );

      act(() => getByText('Change Callback').click());
      expect(getByText('useBecameFriends: false')).toBeInTheDocument();
      act(() => getByText('Become Friends').click());
      expect(getByText('useBecameFriends: true')).toBeInTheDocument();
    });

    it('use state functions with key param', () => {
      const { getByText } = render(
        <BecomeFriendsProvider>
          <BecomeFriendsUseStateWithKeyParam />
          <BecomeFriendsUseValueWithKeyParam />
        </BecomeFriendsProvider>
      );

      act(() => getByText('Change Callback').click());
      expect(getByText('useBecameFriends: false')).toBeInTheDocument();
      act(() => getByText('Become Friends').click());
      expect(getByText('useBecameFriends: true')).toBeInTheDocument();
    });
  });

  describe('scoped providers', () => {
    type MyScopedTestStoreValue = { age: number | null };

    const initialScopedTestStoreValue: MyScopedTestStoreValue = {
      age: null,
    };

    const { useMyScopedTestStoreStore, MyScopedTestStoreProvider } =
      createAtomStore(initialScopedTestStoreValue, {
        name: 'myScopedTestStore' as const,
      });

    const ReadOnlyConsumer = ({ scope }: { scope: string }) => {
      const age = useMyScopedTestStoreStore({ scope }).useAgeValue();

      return (
        <div>
          <span>{JSON.stringify(age)}</span>
        </div>
      );
    };

    const ReadOnlyConsumerWithScopeShorthand = ({
      scope,
    }: {
      scope: string;
    }) => {
      const age = useMyScopedTestStoreStore(scope).useAgeValue();

      return (
        <div>
          <span>{JSON.stringify(age)}</span>
        </div>
      );
    };

    it('returns value of first ancestor when scope matches no provider', () => {
      const { getByText } = render(
        <MyScopedTestStoreProvider scope="scope1" age={1}>
          <MyScopedTestStoreProvider scope="scope2" age={2}>
            <ReadOnlyConsumer scope="scope3" />
          </MyScopedTestStoreProvider>
        </MyScopedTestStoreProvider>
      );

      expect(getByText('2')).toBeInTheDocument();
    });

    it('returns value of first matching ancestor provider', () => {
      const { getByText } = render(
        <MyScopedTestStoreProvider scope="scope1" age={1}>
          <MyScopedTestStoreProvider scope="scope2" age={2}>
            <MyScopedTestStoreProvider scope="scope3" age={3}>
              <MyScopedTestStoreProvider scope="scope2" age={4}>
                <MyScopedTestStoreProvider scope="scope2" age={5} />
                <MyScopedTestStoreProvider scope="scope1" age={6}>
                  <ReadOnlyConsumer scope="scope2" />
                </MyScopedTestStoreProvider>
                <MyScopedTestStoreProvider scope="scope2" age={7} />
              </MyScopedTestStoreProvider>
            </MyScopedTestStoreProvider>
          </MyScopedTestStoreProvider>
        </MyScopedTestStoreProvider>
      );

      expect(getByText('4')).toBeInTheDocument();
    });

    it('allows shorthand to specify scope', () => {
      const { getByText } = render(
        <MyScopedTestStoreProvider scope="scope1" age={1}>
          <MyScopedTestStoreProvider scope="scope2" age={2}>
            <MyScopedTestStoreProvider scope="scope3" age={3}>
              <MyScopedTestStoreProvider scope="scope2" age={4}>
                <MyScopedTestStoreProvider scope="scope2" age={5} />
                <MyScopedTestStoreProvider scope="scope1" age={6}>
                  <ReadOnlyConsumerWithScopeShorthand scope="scope2" />
                </MyScopedTestStoreProvider>
                <MyScopedTestStoreProvider scope="scope2" age={7} />
              </MyScopedTestStoreProvider>
            </MyScopedTestStoreProvider>
          </MyScopedTestStoreProvider>
        </MyScopedTestStoreProvider>
      );

      expect(getByText('4')).toBeInTheDocument();
    });
  });

  describe('multiple unrelated stores', () => {
    type MyFirstTestStoreValue = { name: string };
    type MySecondTestStoreValue = { age: number };

    const initialFirstTestStoreValue: MyFirstTestStoreValue = {
      name: 'My name',
    };

    const initialSecondTestStoreValue: MySecondTestStoreValue = {
      age: 72,
    };

    const { useMyFirstTestStoreStore, MyFirstTestStoreProvider } =
      createAtomStore(initialFirstTestStoreValue, {
        name: 'myFirstTestStore' as const,
      });

    const { useMySecondTestStoreStore, MySecondTestStoreProvider } =
      createAtomStore(initialSecondTestStoreValue, {
        name: 'mySecondTestStore' as const,
      });

    const FirstReadOnlyConsumer = () => {
      const name = useMyFirstTestStoreStore().useNameValue();

      return (
        <div>
          <span>{name}</span>
        </div>
      );
    };

    const SecondReadOnlyConsumer = () => {
      const age = useMySecondTestStoreStore().useAgeValue();

      return (
        <div>
          <span>{age}</span>
        </div>
      );
    };

    it('returns the value for the correct store', () => {
      const { getByText } = render(
        <MyFirstTestStoreProvider name="Jane" scope="firstScope">
          <MySecondTestStoreProvider age={98} scope="secondScope">
            <FirstReadOnlyConsumer />
            <SecondReadOnlyConsumer />
          </MySecondTestStoreProvider>
        </MyFirstTestStoreProvider>
      );

      expect(getByText('Jane')).toBeInTheDocument();
      expect(getByText('98')).toBeInTheDocument();
    });
  });

  describe('extended stores', () => {
    type User = {
      name: string;
      age: number;
    };

    const initialUser: User = {
      name: 'Jane',
      age: 98,
    };

    const { userStore, useUserStore, UserProvider } = createAtomStore(
      initialUser,
      {
        name: 'user' as const,
        extend: ({ name, age }) => ({
          bio: atom((get) => `${get(name)} is ${get(age)} years old`),
        }),
      }
    );

    const ReadOnlyConsumer = () => {
      const bio = useUserStore().useBioValue();

      return <div>{bio}</div>;
    };

    it('includes extended atom in store object', () => {
      const { result } = renderHook(() => useAtomValue(userStore.atom.bio));
      expect(result.current).toBe('Jane is 98 years old');
    });

    it('includes extended atom in get hooks', () => {
      const { result } = renderHook(() => useUserStore().useBioValue());
      expect(result.current).toBe('Jane is 98 years old');
    });

    it('does not include read-only extended atom in set hooks', () => {
      const { result } = renderHook(() =>
        Object.keys(useUserStore()).map((key) => {
          const match = key.match(/^useSet(\w+)$/);
          return match ? match[1].toLowerCase() : null;
        })
      );
      expect(result.current).not.toContain('bio');
    });

    it('does not include read-only extended atom in use hooks', () => {
      const { result } = renderHook(() =>
        Object.keys(useUserStore()).map((key) => {
          const match = key.match(/^use(\w+)State$/);
          return match ? match[1].toLowerCase() : null;
        })
      );
      expect(result.current).not.toContain('bio');
    });

    it('computes extended atom based on current state', () => {
      const { getByText } = render(
        <UserProvider name="John" age={42}>
          <ReadOnlyConsumer />
        </UserProvider>
      );

      expect(getByText('John is 42 years old')).toBeInTheDocument();
    });
  });

  describe('passing atoms as part of initial state', () => {
    type CustomAtom<T> = PrimitiveAtom<T> & {
      isCustomAtom: true;
    };

    const createCustomAtom = <T,>(value: T): CustomAtom<T> => ({
      ...atom(value),
      isCustomAtom: true,
    });

    const { customStore, useCustomStore, CustomProvider } = createAtomStore(
      {
        x: createCustomAtom(1),
      },
      {
        name: 'custom' as const,
      }
    );

    it('uses passed atom', () => {
      const myAtom = customStore.atom.x as CustomAtom<number>;
      expect(myAtom.isCustomAtom).toBe(true);
    });

    it('accepts initial values', () => {
      const { result } = renderHook(() => useCustomStore().useXValue(), {
        wrapper: ({ children }) => (
          <CustomProvider x={2}>{children}</CustomProvider>
        ),
      });

      expect(result.current).toBe(2);
    });
  });

  describe('arbitrary atom accessors', () => {
    type User = {
      name: string;
    };

    const initialUser: User = {
      name: 'Jane',
    };

    const { userStore, useUserStore, UserProvider } = createAtomStore(
      initialUser,
      {
        name: 'user' as const,
      }
    );

    const derivedAtom = atom((get) => `My name is ${get(userStore.atom.name)}`);

    const DerivedAtomConsumer = () => {
      const message = useUserStore().useAtomValue(derivedAtom);

      return <div>{message}</div>;
    };

    it('accesses arbitrary atom within store', () => {
      const { getByText } = render(
        <UserProvider name="John">
          <DerivedAtomConsumer />
        </UserProvider>
      );

      expect(getByText('My name is John')).toBeInTheDocument();
    });
  });

  describe('splitAtoms using todoStore.atom.items', () => {
    const initialState = {
      items: [] as {
        task: string;
        done: boolean;
      }[],
    };

    const { todoStore, useTodoStore, TodoProvider } = createAtomStore(
      initialState,
      {
        name: 'todo' as const,
      }
    );

    const todoAtomsAtom = splitAtom(todoStore.atom.items);

    type TodoType = (typeof initialState)['items'][number];

    const TodoItem = ({
      todoAtom,
      remove,
    }: {
      todoAtom: PrimitiveAtom<TodoType>;
      remove: () => void;
    }) => {
      const [todo, setTodo] = useTodoStore().useAtomState(todoAtom);

      return (
        <div>
          <label>{todo.task}</label>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={() => {
              setTodo((oldValue) => ({ ...oldValue, done: !oldValue.done }));
            }}
          />
          {/* eslint-disable-next-line react/button-has-type */}
          <button onClick={remove}>remove {todo.task}</button>
        </div>
      );
    };

    const TodoList = () => {
      const [todoAtoms, dispatch] = useTodoStore().useAtomState(todoAtomsAtom);
      return (
        <ul>
          {todoAtoms.map((todoAtom) => (
            <TodoItem
              key={`${todoAtom}`}
              todoAtom={todoAtom}
              remove={() => dispatch({ type: 'remove', atom: todoAtom })}
            />
          ))}
        </ul>
      );
    };

    it('should work', () => {
      const { getByText, container } = render(
        <TodoProvider
          initialValues={{
            items: [
              {
                task: 'help the town',
                done: false,
              },
              {
                task: 'feed the dragon',
                done: false,
              },
            ],
          }}
        >
          <TodoList />
        </TodoProvider>
      );

      expect(getByText('help the town')).toBeInTheDocument();
      expect(getByText('feed the dragon')).toBeInTheDocument();

      act(() => getByText('remove help the town').click());

      expect(queryByText(container, 'help the town')).not.toBeInTheDocument();
      expect(getByText('feed the dragon')).toBeInTheDocument();
    });
  });

  describe('splitAtoms using extend', () => {
    const initialState = {
      items: [] as {
        task: string;
        done: boolean;
      }[],
    };

    const { useTodoStore, TodoProvider } = createAtomStore(initialState, {
      name: 'todo' as const,
      extend: ({ items }) => ({
        itemAtoms: splitAtom(items),
      }),
    });

    type TodoType = (typeof initialState)['items'][number];

    const TodoItem = ({
      todoAtom,
      remove,
    }: {
      todoAtom: PrimitiveAtom<TodoType>;
      remove: () => void;
    }) => {
      const [todo, setTodo] = useTodoStore().useAtomState(todoAtom);

      return (
        <div>
          <label>{todo.task}</label>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={() => {
              setTodo((oldValue) => ({ ...oldValue, done: !oldValue.done }));
            }}
          />
          {/* eslint-disable-next-line react/button-has-type */}
          <button onClick={remove}>remove {todo.task}</button>
        </div>
      );
    };

    const TodoList = () => {
      const [todoAtoms, dispatch] = useTodoStore().useItemAtomsState();

      return (
        <ul>
          {todoAtoms.map((todoAtom) => (
            <TodoItem
              key={`${todoAtom}`}
              todoAtom={todoAtom}
              remove={() => dispatch({ type: 'remove', atom: todoAtom })}
            />
          ))}
        </ul>
      );
    };

    it('should work', () => {
      const { getByText, container } = render(
        <TodoProvider
          initialValues={{
            items: [
              {
                task: 'help the town',
                done: false,
              },
              {
                task: 'feed the dragon',
                done: false,
              },
            ],
          }}
        >
          <TodoList />
        </TodoProvider>
      );

      expect(getByText('help the town')).toBeInTheDocument();
      expect(getByText('feed the dragon')).toBeInTheDocument();

      act(() => getByText('remove help the town').click());

      expect(queryByText(container, 'help the town')).not.toBeInTheDocument();
      expect(getByText('feed the dragon')).toBeInTheDocument();
    });
  });
});
